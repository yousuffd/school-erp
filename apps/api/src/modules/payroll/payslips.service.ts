import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payslip } from './entities/payslip.entity';
import { scopedRepo } from '../../common/context/tenant-context';

@Injectable()
export class PayslipsService {
  constructor(@InjectRepository(Payslip) private readonly repoRaw: Repository<Payslip>) {}

  private repo(): Repository<Payslip> {
    return scopedRepo(this.repoRaw, Payslip);
  }

  findForRun(payrollRunId: string): Promise<Payslip[]> {
    return this.repo().find({ where: { payroll_run_id: payrollRunId } });
  }

  /** Self-service — same "employee_id derived from JWT, never client-supplied" pattern as HR Management's reviews/mine, leave-requests/mine. */
  findForEmployee(employeeId: string): Promise<Payslip[]> {
    return this.repo().find({ where: { employee_id: employeeId }, order: { created_at: 'DESC' } });
  }
}