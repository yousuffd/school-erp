import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SalaryStructuresService } from './salary-structures.service';
import { PayrollSettingsService } from './payroll-settings.service';
import { PayrollRunsService } from './payroll-runs.service';
import { PayslipsService } from './payslips.service';
import { LoanAdvancesService } from './loan-advances.service';
import { FullFinalSettlementsService } from './full-final-settlements.service';
import { EmployeesService } from '../hr-management/employees.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { UpdatePayrollSettingsDto } from './dto/update-payroll-settings.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { ProcessPayrollRunDto } from './dto/process-payroll-run.dto';
import { CreateLoanAdvanceDto } from './dto/create-loan-advance.dto';
import { CreateFullFinalSettlementDto } from './dto/create-full-final-settlement.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';


/**
 * Single consolidated controller for Payroll (Blueprint Part 2, Module 11)
 * — same pattern as every Phase 3/4 module so far. Every resource area has
 * its own top-level path segment (salary-structures/, settings/, runs/,
 * loans/, settlements/), no route-ordering collisions.
 */
@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly salaryStructuresService: SalaryStructuresService,
    private readonly payrollSettingsService: PayrollSettingsService,
    private readonly payrollRunsService: PayrollRunsService,
    private readonly payslipsService: PayslipsService,
    private readonly loanAdvancesService: LoanAdvancesService,
    private readonly fullFinalSettlementsService: FullFinalSettlementsService,
    private readonly employeesService: EmployeesService,
  ) {}

  // ---------- Salary Structures ----------

  @Post('salary-structures')
  @Permissions({ module: 'payroll', action: 'create' })
  createSalaryStructure(@Body() dto: CreateSalaryStructureDto) {
    return this.salaryStructuresService.create(dto);
  }

  @Get('salary-structures/by-employee/:employeeId')
  @Permissions({ module: 'payroll', action: 'view' })
  findSalaryStructuresForEmployee(@Param('employeeId') employeeId: string) {
    return this.salaryStructuresService.findAllForEmployee(employeeId);
  }

  // ---------- Settings ----------

  @Get('settings')
  @Permissions({ module: 'payroll', action: 'view' })
  findSettings(@Query('tenantId') tenantId: string) {
    return this.payrollSettingsService.findForTenant(tenantId);
  }

  @Patch('settings')
  @Permissions({ module: 'payroll', action: 'edit' })
  updateSettings(@Query('tenantId') tenantId: string, @Body() dto: UpdatePayrollSettingsDto) {
    return this.payrollSettingsService.update(tenantId, dto);
  }

  // ---------- Payroll Runs ----------

  @Post('runs')
  @Permissions({ module: 'payroll', action: 'create' })
  createRun(@Body() dto: CreatePayrollRunDto) {
    return this.payrollRunsService.createOrFind(dto);
  }

  @Get('runs')
  @Permissions({ module: 'payroll', action: 'view' })
  findRuns(@Query('tenantId') tenantId: string) {
    return this.payrollRunsService.findAllForTenant(tenantId);
  }

  @Get('runs/:id')
  @Permissions({ module: 'payroll', action: 'view' })
  findRun(@Param('id') id: string) {
    return this.payrollRunsService.findOne(id);
  }

  @Post('runs/:id/process')
  @Permissions({ module: 'payroll', action: 'approve' })
  processRun(@Param('id') id: string, @Body() dto: ProcessPayrollRunDto) {
    return this.payrollRunsService.process(id, dto);
  }

  @Patch('runs/:id/mark-disbursed')
  @Permissions({ module: 'payroll', action: 'approve' })
  markDisbursed(@Param('id') id: string) {
    return this.payrollRunsService.markDisbursed(id);
  }

  @Get('runs/:id/bank-file')
  @Permissions({ module: 'payroll', action: 'approve' })
  async downloadBankFile(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.payrollRunsService.generateBankFile(id);
    const filename = `bank-file-${id}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(csv);
  }

  @Get('runs/:id/payslips')
  @Permissions({ module: 'payroll', action: 'view' })
  findPayslipsForRun(@Param('id') id: string) {
    return this.payslipsService.findForRun(id);
  }

  // ---------- Payslips (self-service) ----------

  /** Self-service — employee_id derived from JWT via EmployeesService.findByUserId(), never client-supplied. Same pattern as HR Management's reviews/mine, leave-requests/mine. */
  @Get('payslips/mine')
  async findMyPayslips(@CurrentUser() user: AuthenticatedUser) {
    const employee = await this.employeesService.findByUserId(user.userId);
    if (!employee) return [];
    return this.payslipsService.findForEmployee(employee.id);
  }

  // ---------- Loans & Advances ----------

  @Post('loans')
  @Permissions({ module: 'payroll', action: 'create' })
  createLoan(@Body() dto: CreateLoanAdvanceDto) {
    return this.loanAdvancesService.create(dto);
  }

  @Get('loans')
  @Permissions({ module: 'payroll', action: 'view' })
  findLoans(@Query('tenantId') tenantId: string, @Query('employeeId') employeeId?: string) {
    return this.loanAdvancesService.findAllForTenant(tenantId, employeeId);
  }

  @Patch('loans/:id/close')
  @Permissions({ module: 'payroll', action: 'edit' })
  closeLoan(@Param('id') id: string) {
    return this.loanAdvancesService.closeManually(id);
  }

  // ---------- Full & Final Settlements ----------

  @Post('settlements')
  @Permissions({ module: 'payroll', action: 'create' })
  createSettlement(@Body() dto: CreateFullFinalSettlementDto) {
    return this.fullFinalSettlementsService.create(dto);
  }

  @Get('settlements')
  @Permissions({ module: 'payroll', action: 'view' })
  findSettlements(@Query('tenantId') tenantId: string) {
    return this.fullFinalSettlementsService.findAllForTenant(tenantId);
  }

  @Patch('settlements/:id/process')
  @Permissions({ module: 'payroll', action: 'approve' })
  processSettlement(@Param('id') id: string) {
    return this.fullFinalSettlementsService.process(id);
  }
}