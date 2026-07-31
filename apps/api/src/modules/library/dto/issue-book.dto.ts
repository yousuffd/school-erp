import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Supports both issuing flows (Blueprint Part 2, Module 12 — barcode/RFID
 * issue-return): staff can scan/type a specific copy's barcode directly, OR
 * pick a Book title and let the service auto-assign any available copy.
 * Exactly one of barcode / book_id must be supplied — validated in
 * BookIssuesService.issue(), not here, since "exactly one of two optional
 * fields" isn't a single-decorator class-validator rule worth reaching for
 * a custom validator over.
 */
export class IssueBookDto {
  @IsUUID()
  tenant_id: string;

  @IsUUID()
  student_id: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsUUID()
  book_id?: string;
}
