import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentApprovalStatus } from './entities/document.entity';
import { DocumentAcknowledgment } from './entities/document-acknowledgment.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentApprovalDto } from './dto/update-document-approval.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

export interface DocumentWithAckStatus extends Document {
  acknowledged: boolean;
  acknowledged_at: Date | null;
}

export interface DocumentAckStatusRow {
  user_id: string;
  acknowledged: boolean;
  acknowledged_at: Date | null;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly docRepo: Repository<Document>,
    @InjectRepository(DocumentAcknowledgment) private readonly ackRepo: Repository<DocumentAcknowledgment>,
  ) {}

  private docsRepo(): Repository<Document> {
    return scopedRepo(this.docRepo, Document);
  }
  private acksRepo(): Repository<DocumentAcknowledgment> {
    return scopedRepo(this.ackRepo, DocumentAcknowledgment);
  }

  create(dto: CreateDocumentDto, file: Express.Multer.File, uploadedBy: string): Promise<Document> {
    return this.docsRepo().save(
      this.docsRepo().create({
        tenant_id: dto.tenant_id,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        related_student_id: dto.related_student_id,
        related_employee_id: dto.related_employee_id,
        supersedes_document_id: dto.supersedes_document_id,
        version: dto.supersedes_document_id ? undefined : 1, // let a real supersede bump this explicitly if needed later
        file_path: file.path,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        uploaded_by: uploadedBy,
      }),
    );
  }

  findAllForTenant(tenantId: string, category?: string, studentId?: string, employeeId?: string): Promise<Document[]> {
    const where: any = { tenant_id: tenantId };
    if (category) where.category = category;
    if (studentId) where.related_student_id = studentId;
    if (employeeId) where.related_employee_id = employeeId;
    return this.docsRepo().find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.docsRepo().findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async updateApproval(id: string, dto: UpdateDocumentApprovalDto, approverId: string): Promise<Document> {
    const doc = await this.findOne(id);
    doc.approval_status = dto.approval_status;
    doc.approved_by = dto.approval_status === DocumentApprovalStatus.APPROVED ? approverId : doc.approved_by;
    return this.docsRepo().save(doc);
  }

  async remove(id: string): Promise<void> {
    const result = await this.docsRepo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Document ${id} not found`);
  }

  async getFileForDownload(id: string, user: AuthenticatedUser): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const doc = await this.findOne(id);
    const isStaffWithAccess = (user.permissions ?? []).some((p) => p.module === 'documents' && p.action === 'view');
    const isRelatedStudent = user.studentId && user.studentId === doc.related_student_id;
    const isRelatedParent = user.parentOfStudentIds?.includes(doc.related_student_id ?? '');

    if (!isStaffWithAccess && !isRelatedStudent && !isRelatedParent) {
      throw new ForbiddenException('You do not have access to this document.');
    }
    return { filePath: doc.file_path, filename: doc.original_filename, mimeType: doc.mime_type };
  }

  async acknowledge(documentId: string, user: AuthenticatedUser): Promise<DocumentAcknowledgment> {
    const doc = await this.findOne(documentId);

    const isStaffWithAccess = (user.permissions ?? []).some((p) => p.module === 'documents' && p.action === 'view');
    const isRelatedStudent = user.studentId && user.studentId === doc.related_student_id;
    const isRelatedParent = user.parentOfStudentIds?.includes(doc.related_student_id ?? '');
    if (!isStaffWithAccess && !isRelatedStudent && !isRelatedParent) {
      throw new ForbiddenException('You do not have access to this document.');
    }

    const existing = await this.acksRepo().findOne({
      where: { tenant_id: user.tenantId, document_id: documentId, acknowledged_by: user.userId },
    });
    if (existing) return existing;

    const ack = this.acksRepo().create({ tenant_id: user.tenantId, document_id: documentId, acknowledged_by: user.userId });
    return this.acksRepo().save(ack);
  }

  findAcknowledgmentsForDocument(documentId: string): Promise<DocumentAcknowledgment[]> {
    return this.acksRepo().find({ where: { document_id: documentId } });
  }
}
