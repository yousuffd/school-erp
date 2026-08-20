import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookIssue } from './entities/book-issue.entity';
import { BookCopy, BookCopyStatus } from './entities/book-copy.entity';
import { BookReservation, ReservationStatus } from './entities/book-reservation.entity';
import { IssueBookDto } from './dto/issue-book.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { calculateOverdueFine } from './utils/fine-calculator.util';
import { todayLocalDateStr } from '../../common/utils/local-date.util';

export interface IssueQuery {
  studentId?: string;
  overdueOnly?: boolean;
}

@Injectable()
export class BookIssuesService {
  constructor(
    @InjectRepository(BookIssue) private readonly issueRepo: Repository<BookIssue>,
    @InjectRepository(BookCopy) private readonly copyRepo: Repository<BookCopy>,
    @InjectRepository(BookReservation) private readonly reservationRepo: Repository<BookReservation>,
  ) {}

  private repo(): Repository<BookIssue> {
    return scopedRepo(this.issueRepo, BookIssue);
  }
  private copiesRepo(): Repository<BookCopy> {
    return scopedRepo(this.copyRepo, BookCopy);
  }
  private reservationsRepo(): Repository<BookReservation> {
    return scopedRepo(this.reservationRepo, BookReservation);
  }

  /**
   * Supports both issuing flows per the blueprint's barcode/RFID
   * requirement: exactly one of dto.barcode / dto.book_id must be set.
   * barcode issues that exact copy; book_id auto-picks any AVAILABLE copy
   * of that title (oldest-created first — simple FIFO). No pessimistic
   * row lock on the copy select — a known race-condition gap under real
   * concurrent front-desk traffic, acceptable for this pass given the
   * rest of the codebase doesn't lock elsewhere either; flag if this
   * becomes a real multi-librarian-terminal scenario.
   */
  async issue(dto: IssueBookDto, issuedBy: string): Promise<BookIssue> {
    if (!dto.barcode && !dto.book_id) {
      throw new BadRequestException('Provide either a barcode or a book_id to issue.');
    }
    if (dto.barcode && dto.book_id) {
      throw new BadRequestException('Provide only one of barcode or book_id, not both.');
    }

    let copy: BookCopy | null;
    if (dto.barcode) {
      copy = await this.copiesRepo().findOne({ where: { tenant_id: dto.tenant_id, barcode: dto.barcode } });
      if (!copy) throw new NotFoundException(`No book copy found with barcode "${dto.barcode}".`);
      if (copy.status !== BookCopyStatus.AVAILABLE) {
        throw new BadRequestException(`Copy "${dto.barcode}" is not available (status: ${copy.status}).`);
      }
    } else {
      copy = await this.copiesRepo().findOne({
        where: { tenant_id: dto.tenant_id, book_id: dto.book_id, status: BookCopyStatus.AVAILABLE },
        order: { created_at: 'ASC' },
      });
      if (!copy) throw new BadRequestException('No available copies of this book right now.');
    }

    copy.status = BookCopyStatus.ISSUED;
    await this.copiesRepo().save(copy);

    return this.repo().save(
      this.repo().create({
        tenant_id: dto.tenant_id,
        book_copy_id: copy.id,
        student_id: dto.student_id,
        issued_by: issuedBy,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: dto.due_date,
      }),
    );
  }

  async findAllForTenant(tenantId: string, query: IssueQuery): Promise<BookIssue[]> {
    const qb = this.repo().createQueryBuilder('issue').where('issue.tenant_id = :tenantId', { tenantId });
    if (query.studentId) qb.andWhere('issue.student_id = :studentId', { studentId: query.studentId });
    if (query.overdueOnly) {
      qb.andWhere('issue.return_date IS NULL').andWhere('issue.due_date < :today', {
        today: new Date().toISOString().slice(0, 10),
      });
    }
    return qb.orderBy('issue.issue_date', 'DESC').getMany();
  }

  async findOne(id: string): Promise<BookIssue> {
    const issue = await this.repo().findOne({ where: { id } });
    if (!issue) throw new NotFoundException(`Book issue ${id} not found`);
    return issue;
  }

  /**
   * Returns by barcode — matches the physical-desk workflow (staff scans
   * the copy coming back), not an internal issue-record UUID. Computes the
   * overdue fine automatically. If a reservation is pending for this
   * title, the copy goes to RESERVED (not AVAILABLE) and the oldest
   * pending reservation is marked FULFILLED against this exact copy —
   * otherwise it goes back to AVAILABLE.
   */
  async returnBook(dto: ReturnBookDto, returnedBy: string): Promise<BookIssue> {
    const copy = await this.copiesRepo().findOne({ where: { barcode: dto.barcode } });
    if (!copy) throw new NotFoundException(`No book copy found with barcode "${dto.barcode}".`);

    const openIssue = await this.repo()
      .createQueryBuilder('issue')
      .where('issue.book_copy_id = :copyId', { copyId: copy.id })
      .andWhere('issue.return_date IS NULL')
      .getOne();
    if (!openIssue) {
      throw new BadRequestException(`Copy "${dto.barcode}" is not currently issued.`);
    }

    const returnDate = new Date().toISOString().slice(0, 10);
    openIssue.return_date = returnDate;
    openIssue.returned_by = returnedBy;
    openIssue.fine_amount = calculateOverdueFine(openIssue.due_date, returnDate);
    if (dto.fine_paid !== undefined) openIssue.fine_paid = dto.fine_paid;
    await this.repo().save(openIssue);

    const pendingReservation = await this.reservationsRepo().findOne({
      where: { book_id: copy.book_id, status: ReservationStatus.PENDING },
      order: { created_at: 'ASC' },
    });

    if (pendingReservation) {
      copy.status = BookCopyStatus.RESERVED;
      pendingReservation.status = ReservationStatus.FULFILLED;
      pendingReservation.fulfilled_book_copy_id = copy.id;
      await this.reservationsRepo().save(pendingReservation);
    } else {
      copy.status = BookCopyStatus.AVAILABLE;
    }
    await this.copiesRepo().save(copy);

    return openIssue;
  }
}
