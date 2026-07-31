import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DocumentCategory } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsUUID()
  tenant_id: string;

  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  related_student_id?: string;

  @IsOptional()
  @IsUUID()
  related_employee_id?: string;

  @IsOptional()
  @IsUUID()
  supersedes_document_id?: string;
}
