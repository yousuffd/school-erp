import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { Certificate, CertificateType } from './entities/certificate.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { StudentsService } from '../students/students.service';
import { TenantsService } from '../tenants/tenants.service';
import { scopedRepo } from '../../common/context/tenant-context';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const CERTIFICATE_TITLES: Record<CertificateType, string> = {
  [CertificateType.BONAFIDE]: 'Bonafide Certificate',
  [CertificateType.TRANSFER]: 'Transfer Certificate',
  [CertificateType.CHARACTER]: 'Character Certificate',
};

const CERTIFICATE_BODY: Record<CertificateType, (studentName: string, gradeLevel: string, section?: string) => string> = {
  [CertificateType.BONAFIDE]: (name, grade, section) =>
    `This is to certify that ${name} is a bonafide student of this institution, currently studying in ${grade}${section ? ` - ${section}` : ''} for the current academic year.`,
  [CertificateType.TRANSFER]: (name, grade, section) =>
    `This is to certify that ${name}, a student of ${grade}${section ? ` - ${section}` : ''}, is being relieved from this institution. This Transfer Certificate is issued upon request.`,
  [CertificateType.CHARACTER]: (name, grade, section) =>
    `This is to certify that ${name}, a student of ${grade}${section ? ` - ${section}` : ''}, has borne a good moral character during their time at this institution, to the best of our knowledge.`,
};

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private readonly certRepo: Repository<Certificate>,
    private readonly studentsService: StudentsService,
    private readonly tenantsService: TenantsService,
  ) {}

  private repo(): Repository<Certificate> {
    return scopedRepo(this.certRepo, Certificate);
  }

  create(dto: CreateCertificateDto, issuedBy: string): Promise<Certificate> {
    return this.repo().save(this.repo().create({ ...dto, issued_by: issuedBy }));
  }

  findAllForTenant(tenantId: string, studentId?: string): Promise<Certificate[]> {
    const where: any = { tenant_id: tenantId };
    if (studentId) where.student_id = studentId;
    return this.repo().find({ where, order: { issued_date: 'DESC' } });
  }

  async findOne(id: string): Promise<Certificate> {
    const cert = await this.repo().findOne({ where: { id } });
    if (!cert) throw new NotFoundException(`Certificate ${id} not found`);
    return cert;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo().delete(id);
    if (result.affected === 0) throw new NotFoundException(`Certificate ${id} not found`);
  }

  /**
   * Generated fresh every call — not cached to disk — same "regenerable
   * from data" reasoning as ReportCardsService.generateReportCardPdf.
   * Styling matches that same method: DESIGN_SYSTEM accent #0D9488,
   * secondary text #6B7688.
   */
  async generateCertificatePdf(id: string, user: AuthenticatedUser): Promise<Buffer> {
    const cert = await this.findOne(id);

    const isStaffWithAccess = (user.permissions ?? []).some((p) => p.module === 'documents' && p.action === 'view');
    const isRelatedStudent = user.studentId && user.studentId === cert.student_id;
    const isRelatedParent = user.parentOfStudentIds?.includes(cert.student_id);
    if (!isStaffWithAccess && !isRelatedStudent && !isRelatedParent) {
      throw new ForbiddenException('You do not have access to this certificate.');
    }

    const student = await this.studentsService.findOne(cert.student_id);
    const tenant = await this.tenantsService.findOne(cert.tenant_id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).fillColor('black').text(tenant?.school_name ?? 'SchoolERP', { align: 'center' });
      doc.fontSize(14).fillColor('#0D9488').text(CERTIFICATE_TITLES[cert.certificate_type], { align: 'center' });
      doc.fontSize(10).fillColor('#6B7688').text(`Issued: ${cert.issued_date}`, { align: 'center' });
      doc.moveDown(2);

      const studentName = `${student.first_name} ${student.last_name}`;
      const body = CERTIFICATE_BODY[cert.certificate_type](studentName, student.grade_level, student.section);
      doc.fillColor('black').fontSize(12).text(body, { align: 'justify', lineGap: 4 });

      doc.moveDown(4);
      doc.fontSize(10).text('_________________________', 350);
      doc.text('Authorized Signatory', 350);

      doc.moveDown(3);
      doc.fontSize(8).fillColor('#6B7688').text('System-generated certificate.');

      doc.end();
    });
  }
}
