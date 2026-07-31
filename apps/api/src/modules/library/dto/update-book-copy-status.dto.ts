import { IsEnum } from 'class-validator';
import { BookCopyStatus } from '../entities/book-copy.entity';

export class UpdateBookCopyStatusDto {
  @IsEnum(BookCopyStatus)
  status: BookCopyStatus;
}
