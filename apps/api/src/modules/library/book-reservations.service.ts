import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookReservation, ReservationStatus } from './entities/book-reservation.entity';
import { BookCopy, BookCopyStatus } from './entities/book-copy.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class BookReservationsService {
  constructor(
    @InjectRepository(BookReservation) private readonly reservationRepo: Repository<BookReservation>,
    @InjectRepository(BookCopy) private readonly copyRepo: Repository<BookCopy>,
  ) {}

  private repo(): Repository<BookReservation> {
    return scopedRepo(this.reservationRepo, BookReservation);
  }
  private copiesRepo(): Repository<BookCopy> {
    return scopedRepo(this.copyRepo, BookCopy);
  }

  /**
   * Reserving is meant for when nothing's available right now — if a copy
   * IS available, staff should issue it directly instead of reserving.
   * Enforced as a hard guard (400) for this pass rather than just UI
   * guidance, since allowing a reservation while copies sit available
   * would make BookIssuesService.returnBook's auto-fulfill logic behave
   * confusingly (reserving a copy that was never actually scarce).
   */
  async create(dto: CreateReservationDto): Promise<BookReservation> {
    const availableCount = await this.copiesRepo().count({
      where: { tenant_id: dto.tenant_id, book_id: dto.book_id, status: BookCopyStatus.AVAILABLE },
    });
    if (availableCount > 0) {
      throw new BadRequestException(
        'This book has available copies right now — issue one directly instead of reserving.',
      );
    }
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string, bookId?: string, status?: ReservationStatus): Promise<BookReservation[]> {
    const qb = this.repo().createQueryBuilder('r').where('r.tenant_id = :tenantId', { tenantId });
    if (bookId) qb.andWhere('r.book_id = :bookId', { bookId });
    if (status) qb.andWhere('r.status = :status', { status });
    return qb.orderBy('r.created_at', 'ASC').getMany();
  }

  async cancel(id: string): Promise<BookReservation> {
    const reservation = await this.repo().findOne({ where: { id } });
    if (!reservation) throw new NotFoundException(`Reservation ${id} not found`);
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `Only pending reservations can be cancelled (current status: ${reservation.status}).`,
      );
    }
    reservation.status = ReservationStatus.CANCELLED;
    return this.repo().save(reservation);
  }
}
