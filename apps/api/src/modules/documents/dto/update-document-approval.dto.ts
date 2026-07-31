import { IsEnum } from 'class-validator';
import { DocumentApprovalStatus } from '../entities/document.entity';

export class UpdateDocumentApprovalDto {
  @IsEnum(DocumentApprovalStatus)
  approval_status: DocumentApprovalStatus;
}
