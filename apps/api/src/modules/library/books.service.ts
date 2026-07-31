import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { BookCopy, BookCopyStatus } from './entities/book-copy.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateBookCopyDto } from './dto/create-book-copy.dto';
import { UpdateBookCopyStatusDto } from './dto/update-book-copy-status.dto';
import { scopedRepo } from '../../common/context/tenant-context';

export interface BookQuery {
  title?: string;
  author?: string;
  category?: string;
}

export interface BookWithAvailability extends Book {
  total_copies: number;
  available_copies: number;
}

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(BookCopy) private readonly copyRepo: Repository<BookCopy>,
  ) {}

  private repo(): Repository<Book> {
    return scopedRepo(this.bookRepo, Book);
  }
  private copiesRepo(): Repository<BookCopy> {
    return scopedRepo(this.copyRepo, BookCopy);
  }

  create(dto: CreateBookDto): Promise<Book> {
    return this.repo().save(this.repo().create(dto));
  }

  /** List view includes total/available copy counts — needed by the UI to show at-a-glance stock, not a separate round trip per book. */
  async findAllForTenant(tenantId: string, query: BookQuery): Promise<BookWithAvailability[]> {
    const qb = this.repo()
      .createQueryBuilder('book')
      .leftJoin(BookCopy, 'copy', 'copy.book_id = book.id')
      .addSelect('COUNT(copy.id)', 'total_copies')
      .addSelect('COUNT(copy.id) FILTER (WHERE copy.status = :available)', 'available_copies')
      .where('book.tenant_id = :tenantId', { tenantId })
      .setParameter('available', BookCopyStatus.AVAILABLE)
      .groupBy('book.id');

    if (query.title) qb.andWhere('book.title ILIKE :title', { title: `%${query.title}%` });
    if (query.author) qb.andWhere('book.author ILIKE :author', { author: `%${query.author}%` });
    if (query.category) qb.andWhere('book.category = :category', { category: query.category });

    const { entities, raw } = await qb.orderBy('book.title', 'ASC').getRawAndEntities();
    return entities.map((book, i) => ({
      ...book,
      total_copies: parseInt(raw[i].total_copies, 10),
      available_copies: parseInt(raw[i].available_copies, 10),
    }));
  }

  async findOne(id: string): Promise<Book & { copies: BookCopy[] }> {
    const book = await this.repo().findOne({ where: { id } });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    const copies = await this.copiesRepo().find({ where: { book_id: id }, order: { barcode: 'ASC' } });
    return { ...book, copies };
  }

  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.repo().findOne({ where: { id } });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    Object.assign(book, dto);
    return this.repo().save(book);
  }

  /** Hard delete, guarded: refuses if any copies still reference this title (soft-delete-preferred convention — force staff to consciously remove copies first, not silently cascade-lose issue history). */
  async remove(id: string): Promise<void> {
    const copyCount = await this.copiesRepo().count({ where: { book_id: id } });
    if (copyCount > 0) {
      throw new BadRequestException(
        `Cannot delete a book with ${copyCount} existing copy record(s). Remove its copies first.`,
      );
    }
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Book ${id} not found`);
  }

  // --- Copies ---

  async addCopy(dto: CreateBookCopyDto): Promise<BookCopy> {
    const book = await this.repo().findOne({ where: { id: dto.book_id } });
    if (!book) throw new NotFoundException(`Book ${dto.book_id} not found`);
    return this.copiesRepo().save(this.copiesRepo().create(dto));
  }

  findCopiesForBook(bookId: string): Promise<BookCopy[]> {
    return this.copiesRepo().find({ where: { book_id: bookId }, order: { barcode: 'ASC' } });
  }

  /**
   * Direct staff-facing status editor (mark lost / under_repair / back to
   * available). Deliberately refuses to touch an ISSUED copy — that
   * transition only happens through the issue/return workflow
   * (BookIssuesService.returnBook), so this can't be used to silently
   * short-circuit an open issue record.
   */
  async updateCopyStatus(id: string, dto: UpdateBookCopyStatusDto): Promise<BookCopy> {
    const copy = await this.copiesRepo().findOne({ where: { id } });
    if (!copy) throw new NotFoundException(`Book copy ${id} not found`);
    if (copy.status === BookCopyStatus.ISSUED && dto.status !== BookCopyStatus.ISSUED) {
      throw new BadRequestException(
        `Copy "${copy.barcode}" is currently issued. Process a return instead of changing its status directly.`,
      );
    }
    copy.status = dto.status;
    return this.copiesRepo().save(copy);
  }
}
