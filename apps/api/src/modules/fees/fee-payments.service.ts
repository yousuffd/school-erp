import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { FeePayment } from './entities/fee-payment.entity';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { CreateFeePaymentDto } from './dto/create-fee-payment.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { TenantsService } from '../tenants/tenants.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { assertParentFeeAccess } from '../../common/utils/fee-self-service-access.util';

@Injectable()
export class FeePaymentsService {
  constructor(
    @InjectRepository(FeePayment) private readonly paymentRepo: Repository<FeePayment>,
    @InjectRepository(FeeAssignment) private readonly assignmentRepo: Repository<FeeAssignment>,
    @InjectRepository(FeeStructure) private readonly structureRepo: Repository<FeeStructure>,
    private readonly studentsService: StudentsService,
    private readonly tenantsService: TenantsService,
  ) {}

  private repo(): Repository<FeePayment> {
    return scopedRepo(this.paymentRepo, FeePayment);
  }
  private assignmentsRepo(): Repository<FeeAssignment> {
    return scopedRepo(this.assignmentRepo, FeeAssignment);
  }
  private structuresRepo(): Repository<FeeStructure> {
    return scopedRepo(this.structureRepo, FeeStructure);
  }

  async create(tenantId: string, dto: CreateFeePaymentDto, recordedBy: string): Promise<FeePayment> {
    const assignment = await this.assignmentsRepo().findOne({ where: { id: dto.fee_assignment_id } });
    if (!assignment) throw new NotFoundException(`Fee assignment ${dto.fee_assignment_id} not found`);

    return this.repo().save(
      this.repo().create({ ...dto, tenant_id: tenantId, recorded_by: recordedBy }),
    );
  }

  findForAssignment(assignmentId: string): Promise<FeePayment[]> {
    return this.repo().find({ where: { fee_assignment_id: assignmentId }, order: { payment_date: 'DESC' } });
  }

  async findOne(id: string): Promise<FeePayment> {
    const payment = await this.repo().findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  /**
   * Generates a real PDF receipt for a recorded payment — not just an
   * on-screen summary. Kept deliberately simple (no logo/letterhead
   * templating system, which would be its own feature) but includes
   * everything a parent would actually need: who paid, how much, for what,
   * when, and by what method, plus the receipt/reference number for their
   * own records.
   */
  async generateReceiptPdf(paymentId: string): Promise<Buffer> {
    const payment = await this.findOne(paymentId);
    const assignment = await this.assignmentsRepo().findOne({ where: { id: payment.fee_assignment_id } });
    if (!assignment) throw new NotFoundException(`Fee assignment ${payment.fee_assignment_id} not found`);

    const [student, structure, tenant] = await Promise.all([
      this.studentsService.findOne(assignment.student_id),
      this.structuresRepo().findOne({ where: { id: assignment.fee_structure_id } }),
      this.tenantsService.findOne(payment.tenant_id),
    ]);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(tenant?.school_name ?? 'SchoolERP', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14).fillColor('#0D9488').text('Fee Payment Receipt', { align: 'center' });
      doc.fillColor('black').moveDown(1.5);

      doc.fontSize(10).fillColor('#6B7688');
      doc.text(`Receipt No: ${payment.id}`);
      doc.text(`Date: ${payment.payment_date}`);
      doc.moveDown(1);

      doc.fillColor('black').fontSize(12);
      doc.text(`Student: ${student.first_name} ${student.last_name}`);
      doc.text(`Admission No: ${student.admission_number}`);
      doc.text(`Fee Structure: ${structure?.name ?? 'N/A'}`);
      doc.moveDown(1);

      doc.fontSize(16).fillColor('#0D9488').text(`Amount Paid: Rs. ${parseFloat(payment.amount).toFixed(2)}`);
      doc.fillColor('black').fontSize(11).moveDown(0.5);
      doc.text(`Payment Method: ${payment.method.replace('_', ' ')}`);
      if (payment.reference_number) doc.text(`Reference Number: ${payment.reference_number}`);
      if (payment.notes) doc.text(`Notes: ${payment.notes}`);

      doc.moveDown(2);
      doc.fontSize(9).fillColor('#6B7688').text(
        'This is a system-generated receipt for the payment recorded above and does not itself represent a full statement of account.',
        { align: 'left' },
      );

      doc.end();
    });
  }

  /**
   * Self-service payment history — re-derives the assignment's student_id
   * and checks Parent/Teacher access against that student before returning
   * anything (same defense-in-depth as every other self-service route this
   * project has added — never trust that holding an assignmentId implies
   * entitlement to it).
   */
  async findForAssignmentSelfService(user: AuthenticatedUser, assignmentId: string): Promise<FeePayment[]> {
    const assignment = await this.assignmentsRepo().findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException(`Fee assignment ${assignmentId} not found`);
    assertParentFeeAccess(user, assignment.student_id);
    return this.findForAssignment(assignmentId);
  }

  /**
   * Self-service receipt download — same re-derivation pattern, one level
   * deeper (payment -> assignment -> student).
   */
  async generateReceiptPdfSelfService(user: AuthenticatedUser, paymentId: string): Promise<Buffer> {
    const payment = await this.findOne(paymentId);
    const assignment = await this.assignmentsRepo().findOne({ where: { id: payment.fee_assignment_id } });
    if (!assignment) throw new NotFoundException(`Fee assignment ${payment.fee_assignment_id} not found`);
    assertParentFeeAccess(user, assignment.student_id);
    return this.generateReceiptPdf(paymentId);
  }
}
