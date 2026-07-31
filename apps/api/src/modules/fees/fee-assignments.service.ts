import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeAdjustment, FeeAdjustmentType } from './entities/fee-adjustment.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';
import { AssignFeeDto } from './dto/assign-fee.dto';
import { BulkAssignFeeDto } from './dto/bulk-assign-fee.dto';
import { scopedRepo } from '../../common/context/tenant-context';
import { StudentsService } from '../students/students.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { assertParentFeeAccess } from '../../common/utils/fee-self-service-access.util';

export interface FeeBalance {
  assignment: FeeAssignment;
  totalOwed: number;
  totalAdjustments: number;
  totalPaid: number;
  outstanding: number;
  installments: Array<{ id: string; label: string; due_date: string; amount: number; paid: number; outstanding: number }>;
  transportIncluded: boolean;
}

// Excludes only genuinely terminal statuses — the same fix already applied
// once to the Attendance roster. A freshly admitted student is 'enrolled',
// not 'active', until someone manually flips that later; filtering bulk
// assignment to status==='active' only silently skipped almost everyone.
const TERMINAL_STUDENT_STATUSES = new Set(['withdrawn', 'transferred', 'graduated', 'alumni', 'duplicate']);

@Injectable()
export class FeeAssignmentsService {
  constructor(
    @InjectRepository(FeeAssignment) private readonly assignmentRepo: Repository<FeeAssignment>,
    @InjectRepository(FeeStructure) private readonly structureRepo: Repository<FeeStructure>,
    @InjectRepository(FeeAdjustment) private readonly adjustmentRepo: Repository<FeeAdjustment>,
    @InjectRepository(FeePayment) private readonly paymentRepo: Repository<FeePayment>,
    private readonly studentsService: StudentsService,
  ) {}

  private repo(): Repository<FeeAssignment> {
    return scopedRepo(this.assignmentRepo, FeeAssignment);
  }
  private structuresRepo(): Repository<FeeStructure> {
    return scopedRepo(this.structureRepo, FeeStructure);
  }
  private adjustmentsRepo(): Repository<FeeAdjustment> {
    return scopedRepo(this.adjustmentRepo, FeeAdjustment);
  }
  private paymentsRepo(): Repository<FeePayment> {
    return scopedRepo(this.paymentRepo, FeePayment);
  }

  async assign(tenantId: string, dto: AssignFeeDto): Promise<FeeAssignment> {
    const structure = await this.structuresRepo().findOne({ where: { id: dto.fee_structure_id } });
    if (!structure) throw new NotFoundException(`Fee structure ${dto.fee_structure_id} not found`);

    const existing = await this.repo().findOne({
      where: { tenant_id: tenantId, student_id: dto.student_id, fee_structure_id: dto.fee_structure_id },
    });
    if (existing) throw new ConflictException('This student is already assigned to this fee structure.');

    return this.repo().save(
      this.repo().create({
        tenant_id: tenantId,
        student_id: dto.student_id,
        fee_structure_id: dto.fee_structure_id,
        academic_year_id: structure.academic_year_id,
      }),
    );
  }

  /**
   * Assigns a fee structure to every active student currently in a class,
   * skipping anyone already assigned (rather than erroring the whole batch
   * over one duplicate) — this is meant to be run once per term/year over a
   * roster that may already have partial assignments from prior runs.
   */
  async bulkAssign(tenantId: string, dto: BulkAssignFeeDto): Promise<{ assigned: number; skipped: number }> {
    const structure = await this.structuresRepo().findOne({ where: { id: dto.fee_structure_id } });
    if (!structure) throw new NotFoundException(`Fee structure ${dto.fee_structure_id} not found`);

    const fullRoster = await this.studentsService.findAllForTenant(tenantId, {
      schoolClassId: dto.school_class_id,
    });
    const roster = fullRoster.filter((s) => !TERMINAL_STUDENT_STATUSES.has(s.status));

    let assigned = 0;
    let skipped = 0;
    for (const student of roster) {
      const existing = await this.repo().findOne({
        where: { tenant_id: tenantId, student_id: student.id, fee_structure_id: dto.fee_structure_id },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await this.repo().save(
        this.repo().create({
          tenant_id: tenantId,
          student_id: student.id,
          fee_structure_id: dto.fee_structure_id,
          academic_year_id: structure.academic_year_id,
        }),
      );
      assigned++;
    }
    return { assigned, skipped };
  }

  async findForStudent(studentId: string): Promise<FeeAssignment[]> {
    return this.repo().find({ where: { student_id: studentId }, order: { assigned_at: 'DESC' } });
  }

  /**
   * The actual balance computation: owed (from the structure's live
   * components — see FeeAssignment's entity comment on why this isn't
   * snapshotted) + fines - discounts, minus whatever's been paid, broken
   * down per installment so a parent/admin can see "Term 1 paid, Term 2 due."
   */
  async getBalance(assignmentId: string): Promise<FeeBalance> {
    const assignment = await this.repo().findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException(`Fee assignment ${assignmentId} not found`);

    const structure = await this.structuresRepo().findOne({
      where: { id: assignment.fee_structure_id },
      relations: ['components', 'installments'],
    });
    if (!structure) throw new NotFoundException(`Fee structure ${assignment.fee_structure_id} not found`);

    const adjustments = await this.adjustmentsRepo().find({ where: { fee_assignment_id: assignmentId } });
    const payments = await this.paymentsRepo().find({ where: { fee_assignment_id: assignmentId } });

    const totalOwed = structure.components.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const totalAdjustments = adjustments.reduce(
      (sum, a) => sum + (a.type === FeeAdjustmentType.FINE ? 1 : -1) * parseFloat(a.amount),
      0,
    );
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const installments = structure.installments.map((i) => {
      const paidForInstallment = payments
        .filter((p) => p.fee_installment_id === i.id)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const amount = parseFloat(i.amount);
      return {
        id: i.id,
        label: i.label,
        due_date: i.due_date,
        amount,
        paid: paidForInstallment,
        outstanding: amount - paidForInstallment,
      };
    });

    return {
      assignment,
      totalOwed,
      totalAdjustments,
      totalPaid,
      outstanding: totalOwed + totalAdjustments - totalPaid,
      installments,
      transportIncluded: structure.transport_included,
    };
  }

  /**
   * Parent self-service transport opt-in/out. Switches the student's
   * CURRENT-year fee assignment to the companion structure for the same
   * grade with the opposite transport_included value, found by (tenant,
   * academic_year, grade_level, transport_included) rather than by
   * matching structure names as strings.
   *
   * Refuses if payments already exist against the current assignment —
   * switching structures means deleting that assignment, and ON DELETE
   * CASCADE on fee_payments would silently destroy real payment history.
   * Same "don't let a structural change destroy recorded data" discipline
   * already applied to ExamGroups refusing deletion once marks exist.
   */
  async setTransportPreference(
    user: AuthenticatedUser,
    studentId: string,
    wantsTransport: boolean,
  ): Promise<FeeAssignment> {
    assertParentFeeAccess(user, studentId);

    const currentAssignment = await this.repo()
      .createQueryBuilder('assignment')
      .innerJoin(FeeStructure, 'structure', 'structure.id = assignment.fee_structure_id')
      .innerJoin(AcademicYear, 'year', 'year.id = structure.academic_year_id')
      .where('assignment.student_id = :studentId', { studentId })
      .andWhere('year.is_current = true')
      .getOne();

    if (!currentAssignment) {
      throw new NotFoundException('No fee assignment found for the current academic year.');
    }

    const currentStructure = await this.structuresRepo().findOne({
      where: { id: currentAssignment.fee_structure_id },
    });
    if (!currentStructure) {
      throw new NotFoundException(`Fee structure ${currentAssignment.fee_structure_id} not found`);
    }

    if (currentStructure.transport_included === wantsTransport) {
      return currentAssignment;
    }

    const existingPayments = await this.paymentsRepo().count({
      where: { fee_assignment_id: currentAssignment.id },
    });
    if (existingPayments > 0) {
      throw new BadRequestException(
        'Payments have already been recorded against this fee assignment — contact the school office to change the transport preference.',
      );
    }

    const companionStructure = await this.structuresRepo().findOne({
      where: {
        tenant_id: currentStructure.tenant_id,
        academic_year_id: currentStructure.academic_year_id,
        grade_level: currentStructure.grade_level,
        transport_included: wantsTransport,
      },
    });
    if (!companionStructure) {
      throw new NotFoundException(
        `No ${wantsTransport ? 'with' : 'without'}-transport fee structure exists for ${currentStructure.grade_level} yet — contact the school office.`,
      );
    }

    await this.repo().delete({ id: currentAssignment.id });

    return this.repo().save(
      this.repo().create({
        tenant_id: currentStructure.tenant_id,
        student_id: studentId,
        fee_structure_id: companionStructure.id,
        academic_year_id: currentStructure.academic_year_id,
      }),
    );
  }

  /**
   * Self-service list — Parent (own linked child) or Teacher (own scoped
   * students) only. Student is deliberately excluded, per explicit scope
   * decision (unlike Examinations/Discipline's Student self-service).
   */
  async findForStudentSelfService(user: AuthenticatedUser, studentId: string): Promise<FeeAssignment[]> {
    assertParentFeeAccess(user, studentId);
    return this.findForStudent(studentId);
  }

  /**
   * Self-service balance — re-derives the assignment's real student_id and
   * re-checks Parent/Teacher access against THAT student, rather than
   * trusting that a caller who could see the assignment id is automatically
   * entitled to it (same defense-in-depth pattern as Communication's
   * markReadForStudent).
   */
  async getBalanceSelfService(user: AuthenticatedUser, assignmentId: string): Promise<FeeBalance> {
    const assignment = await this.repo().findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException(`Fee assignment ${assignmentId} not found`);
    assertParentFeeAccess(user, assignment.student_id);
    return this.getBalance(assignmentId);
  }
}
