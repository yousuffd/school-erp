import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { BookCopy } from './entities/book-copy.entity';
import { BookIssue } from './entities/book-issue.entity';
import { BookReservation } from './entities/book-reservation.entity';
import { BooksService } from './books.service';
import { BookIssuesService } from './book-issues.service';
import { BookReservationsService } from './book-reservations.service';
import { BooksController } from './books.controller';
import { BookIssuesController } from './book-issues.controller';
import { BookReservationsController } from './book-reservations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BookCopy, BookIssue, BookReservation])],
  controllers: [BooksController, BookIssuesController, BookReservationsController],
  providers: [BooksService, BookIssuesService, BookReservationsService],
  exports: [BooksService, BookIssuesService, BookReservationsService],
})
export class LibraryModule {}
