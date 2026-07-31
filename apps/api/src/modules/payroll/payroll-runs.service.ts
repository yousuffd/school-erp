import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRun, PayrollRunStatus } from './entities/payroll-run.entity';
import { Payslip } from './entities/payslip.entity';
import { LoanAdvance, LoanAdvanceStatus } from './entities/loan-advance.entity';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { ProcessPayrollRunDto } from './dto/process-payroll-run.dto';
import { SalaryStructuresService } from './salary-structures.service';
import { PayrollSettingsService } from './payroll-settings.service';
import { EmployeesService } from '../hr-management/employees.service';
import { EmployeeStatus } from '../hr-management/entities/employee.entity';
import { scopedRepo } from '../../common/context/tenant-context';

const PF_RATE = 0.12; // employee and employer, each — no wage-ceiling cap (documented simplification)
const ESI_EMPLOYEE_RATE = 0.0075;
const ESI_EMPLOYER_RATE = 0.0325;
const ESI_ELIGIBILITY_THRESHOLD = 21000; // gross salary, monthly

@Injectable()
export class PayrollRunsService {
  constructor(
    @InjectRepository(PayrollRun) private readonly runRepo: Repository<PayrollRun>,
    @InjectRepository(Payslip) private readonly payslipRepo: Repository<Payslip>,
    @InjectRepository(LoanAdvance) private readonly loanRepo: Repository<LoanAdvance>,
    private readonly salaryStructuresService: SalaryStructuresService,
    private readonly payrollSettingsService: PayrollSettingsService,
    private readonly employeesService: EmployeesService,
  ) {}

  private repo(): Repository<PayrollRun> {
    return scopedRepo(this.runRepo, PayrollRun);
  }
  private payslips(): Repository<Payslip> {
    return scopedRepo(this.payslipRepo, Payslip);
  }
  private loans(): Repository<LoanAdvance> {
    return scopedRepo(this.loanRepo, LoanAdvance);
  }

  /** Idempotent — returns the existing draft/processed/disbursed run for this period if one already exists, rather than erroring. */
  async createOrFind(dto: CreatePayrollRunDto): Promise<PayrollRun> {
    const existing = await this.repo().findOne({
      where: { tenant_id: dto.tenant_id, month: dto.month, year: dto.year },
    });
    if (existing) return existing;
    return this.repo().save(this.repo().create(dto));
  }

  findAllForTenant(tenantId: string): Promise<PayrollRun[]> {
    return this.repo().find({ where: { tenant_id: tenantId }, order: { year: 'DESC', month: 'DESC' } });
  }

  async findOne(id: string): Promise<PayrollRun> {
    const run = await this.repo().findOne({ where: { id } });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);
    return run;
  }

  /**
   * The actual statutory calculation. Only runs on a 'draft' run — re-running
   * an already-processed run is rejected rather than silently recomputing,
   * since that could change disbursed figures after the fact. Skips (does
   * not fail the whole batch for) any active employee with no SalaryStructure
   * on file — returns which employees were skipped so the caller knows.
   */
  async process(id: string, dto: ProcessPayrollRunDto): Promise<{ run: PayrollRun; payslips: Payslip[]; skippedEmployeeIds: string[] }> {
    const run = await this.findOne(id);
    if (run.status !== PayrollRunStatus.DRAFT) {
      throw new BadRequestException(`Payroll run is already ${run.status} — cannot re-process.`);
    }

    const settings = await this.payrollSettingsService.findForTenant(run.tenant_id);
    const professionalTax = settings ? Number(settings.professional_tax_amount) : 200;

    const asOfDate = `${run.year}-${String(run.month).padStart(2, '0')}-01`;
    const employees = await this.employeesService.findAllForTenant(run.tenant_id);
    const activeEmployees = employees.filter((e) => e.status === EmployeeStatus.ACTIVE);

    const adjustmentsByEmployee = new Map((dto.adjustments ?? []).map((a) => [a.employee_id, a]));
    const skippedEmployeeIds: string[] = [];
    const createdPayslips: Payslip[] = [];

    for (const employee of activeEmployees) {
      const structure = await this.salaryStructuresService.findCurrentForEmployee(employee.id, asOfDate);
      if (!structure) {
        skippedEmployeeIds.push(employee.id);
        continue;
      }

      const basic = Number(structure.basic_salary);
      const hra = Number(structure.hra);
      const specialAllowance = Number(structure.special_allowance);
      const otherAllowances = Number(structure.other_allowances);
      const adjustment = adjustmentsByEmployee.get(employee.id);
      const bonuses = Number(adjustment?.bonuses ?? 0);
      const overtime = Number(adjustment?.overtime ?? 0);
      const reimbursements = Number(adjustment?.reimbursements ?? 0);

      const grossSalary = basic + hra + specialAllowance + otherAllowances;

      const pfEmployee = basic * PF_RATE;
      const pfEmployer = basic * PF_RATE;

      const esiEligible = grossSalary <= ESI_ELIGIBILITY_THRESHOLD;
      const esiEmployee = esiEligible ? grossSalary * ESI_EMPLOYEE_RATE : 0;
      const esiEmployer = esiEligible ? grossSalary * ESI_EMPLOYER_RATE : 0;

      // Loan auto-recovery — never deducts more than what's actually owed.
      let loanDeduction = 0;
      const activeLoan = await this.loans().findOne({
        where: { employee_id: employee.id, status: LoanAdvanceStatus.ACTIVE },
      });
      if (activeLoan) {
        loanDeduction = Math.min(Number(activeLoan.monthly_recovery_amount), Number(activeLoan.remaining_balance));
        const newBalance = Number(activeLoan.remaining_balance) - loanDeduction;
        activeLoan.remaining_balance = String(newBalance);
        if (newBalance <= 0) activeLoan.status = LoanAdvanceStatus.CLOSED;
        await this.loans().save(activeLoan);
      }

      const netSalary =
        grossSalary + bonuses + overtime + reimbursements - pfEmployee - esiEmployee - professionalTax - loanDeduction;

      let payslip = await this.payslips().findOne({
        where: { payroll_run_id: run.id, employee_id: employee.id },
      });
      if (!payslip) {
        payslip = this.payslips().create({ tenant_id: run.tenant_id, payroll_run_id: run.id, employee_id: employee.id });
      }
      Object.assign(payslip, {
        basic_salary: String(basic),
        hra: String(hra),
        special_allowance: String(specialAllowance),
        other_allowances: String(otherAllowances),
        gross_salary: String(grossSalary),
        pf_employee: String(pfEmployee),
        pf_employer: String(pfEmployer),
        esi_employee: String(esiEmployee),
        esi_employer: String(esiEmployer),
        professional_tax: String(professionalTax),
        bonuses: String(bonuses),
        overtime: String(overtime),
        reimbursements: String(reimbursements),
        loan_deduction: String(loanDeduction),
        net_salary: String(netSalary),
      });
      createdPayslips.push(await this.payslips().save(payslip));
    }

    run.status = PayrollRunStatus.PROCESSED;
    run.processed_date = new Date().toISOString().slice(0, 10);
    await this.repo().save(run);

    return { run, payslips: createdPayslips, skippedEmployeeIds };
  }

  async markDisbursed(id: string): Promise<PayrollRun> {
    const run = await this.findOne(id);
    if (run.status !== PayrollRunStatus.PROCESSED) {
      throw new BadRequestException(`Payroll run must be processed before it can be disbursed (currently ${run.status}).`);
    }
    run.status = PayrollRunStatus.DISBURSED;
    return this.repo().save(run);
  }

  /**
   * Generates a plain CSV bank-disbursement file — no real bank integration,
   * just a structured export. Employees missing bank details on their
   * SalaryStructure are included with blank fields rather than silently
   * excluded, so the gap is visible in the file itself, not hidden.
   */
  async generateBankFile(id: string): Promise<string> {
    const run = await this.findOne(id);
    if (run.status === PayrollRunStatus.DRAFT) {
      throw new BadRequestException('Payroll run must be processed before a bank file can be generated.');
    }

    const payslips = await this.payslips().find({ where: { payroll_run_id: run.id } });
    const rows = ['employee_id,account_holder_name,account_number,ifsc_code,net_salary'];
    for (const payslip of payslips) {
      const structure = await this.salaryStructuresService.findCurrentForEmployee(
        payslip.employee_id,
        `${run.year}-${String(run.month).padStart(2, '0')}-01`,
      );
      rows.push(
        [
          payslip.employee_id,
          structure?.bank_account_holder_name ?? '',
          structure?.bank_account_number ?? '',
          structure?.bank_ifsc_code ?? '',
          payslip.net_salary,
        ].join(','),
      );
    }

    run.bank_file_generated_at = new Date();
    await this.repo().save(run);

    return rows.join('\n');
  }
}