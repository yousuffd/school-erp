import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CertificatesService } from './certificates.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentApprovalDto } from './dto/update-document-approval.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { documentUploadOptions } from './config/document-upload.config';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Single consolidated controller for Document Management & Digital
 * Signatures (Blueprint Part 2, Module 19). Absorbed what used to be
 * HrPolicyDocument (HR Management) — see MigrateHrPolicyDocuments
 * migration for the data-copy/remap. Certificates are a separate,
 * simpler sub-resource (data-driven, regenerated on demand, no upload).
 */
@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly certificatesService: CertificatesService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @Permissions({ module: 'documents', action: 'create' })
  @UseInterceptors(FileInterceptor('file', documentUploadOptions))
  create(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.create(dto, file, user.userId);
  }

  @Get()
  @Permissions({ module: 'documents', action: 'view' })
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('category') category?: string,
    @Query('studentId') studentId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.documentsService.findAllForTenant(tenantId, category, studentId, employeeId);
  }

  // ---------- Certificates (declared ABOVE :id — same static-before-
  // dynamic precedent as Activities' events/my-registrations fix,
  // session 30 — 'certificates' is a single path segment identical in
  // shape to :id and would otherwise be swallowed by it) ----------

  @Post('certificates')
  @Permissions({ module: 'documents', action: 'create' })
  createCertificate(@Body() dto: CreateCertificateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.certificatesService.create(dto, user.userId);
  }

  @Get('certificates')
  @Permissions({ module: 'documents', action: 'view' })
  findCertificates(@Query('tenantId') tenantId: string, @Query('studentId') studentId?: string) {
    return this.certificatesService.findAllForTenant(tenantId, studentId);
  }

  @Get('certificates/:id/pdf')
  async downloadCertificate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const pdf = await this.certificatesService.generateCertificatePdf(id, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificate-${id}.pdf"`);
    res.send(pdf);
  }

  @Delete('certificates/:id')
  @Permissions({ module: 'documents', action: 'delete' })
  removeCertificate(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }

  @Get(':id')
  @Permissions({ module: 'documents', action: 'view' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id/approval')
  @Permissions({ module: 'documents', action: 'approve' })
  updateApproval(@Param('id') id: string, @Body() dto: UpdateDocumentApprovalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.updateApproval(id, dto, user.userId);
  }

  @Delete(':id')
  @Permissions({ module: 'documents', action: 'delete' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  /**
   * Dual/triple authorization inside the service (staff-with-permission OR
   * the related Student OR that student's Parent) — no @Permissions()
   * decorator here, same reasoning as every other dual-gated download
   * route this project (HR policy documents, LMS lectures, etc.).
   */
  @Get(':id/file')
  async downloadFile(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { filePath, filename, mimeType } = await this.documentsService.getFileForDownload(id, user);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.sendFile(filePath);
  }

  @Post(':id/acknowledge')
  acknowledge(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.acknowledge(id, user);
  }

  @Get(':id/acknowledgments')
  @Permissions({ module: 'documents', action: 'view' })
  findAcknowledgments(@Param('id') id: string) {
    return this.documentsService.findAcknowledgmentsForDocument(id);
  }


}
