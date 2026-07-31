import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanAdvance, LoanAdvanceStatus } from './entities/loan-advance.entity';
import { CreateLoanAdvanceDto } from './dto/create-loan-advance.dto';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class LoanAdvancesService {
  constructor(@InjectRepository(LoanAdvance) private readonly repoRaw: Repository<LoanAdvance>) {}

  private repo(): Repository<LoanAdvance> {
    return scopedRepo(this.repoRaw, LoanAdvance);
  }

  /**
   * One active loan per employee at a time — matches Hostel's "one active
   * allocation per student" guard precedent. PayrollRunsService.process()
   * assumes at most one active loan per employee when computing
   * loan_deduction; allowing a second active loan would make that lookup
   * ambiguous (findOne() would pick one arbitrarily).
   */
  async create(dto: CreateLoanAdvanceDto): Promise<LoanAdvance> {
    const existingActive = await this.repo().findOne({
      where: { employee_id: dto.employee_id, status: LoanAdvanceStatus.ACTIVE },
    });
    if (existingActive) {
      throw new BadRequestException(
        `Employee already has an active loan/advance (${existingActive.id}) — it must be fully recovered or closed first.`,
      );
    }
    return this.repo().save(
      this.repo().create({ ...dto, remaining_balance: dto.amount, status: LoanAdvanceStatus.ACTIVE }),
    );
  }

  findAllForTenant(tenantId: string, employeeId?: string): Promise<LoanAdvance[]> {
    const where: any = { tenant_id: tenantId };
    if (employeeId) where.employee_id = employeeId;
    return this.repo().find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<LoanAdvance> {
    const loan = await this.repo().findOne({ where: { id } });
    if (!loan) throw new NotFoundException(`Loan/advance ${id} not found`);
    return loan;
  }

  /** Manual override — e.g. an employee pays off the remainder outside payroll. Auto-recovery via payroll runs happens in PayrollRunsService.process(), not here. */
  async closeManually(id: string): Promise<LoanAdvance> {
    const loan = await this.findOne(id);
    if (loan.status === LoanAdvanceStatus.CLOSED) {
      throw new BadRequestException('This loan/advance is already closed.');
    }
    loan.status = LoanAdvanceStatus.CLOSED;
    loan.remaining_balance = '0';
    return this.repo().save(loan);
  }
}