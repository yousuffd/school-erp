import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryStructure } from './entities/salary-structure.entity';
import { PayrollSettings } from './entities/payroll-settings.entity';
import { PayrollRun } from './entities/payroll-run.entity';
import { Payslip } from './entities/payslip.entity';
import { LoanAdvance } from './entities/loan-advance.entity';
import { FullFinalSettlement } from './entities/full-final-settlement.entity';
import { SalaryStructuresService } from './salary-structures.service';
import { PayrollSettingsService } from './payroll-settings.service';
import { PayrollRunsService } from './payroll-runs.service';
import { PayslipsService } from './payslips.service';
import { LoanAdvancesService } from './loan-advances.service';
import { FullFinalSettlementsService } from './full-final-settlements.service';
import { PayrollController } from './payroll.controller';
import { HrManagementModule } from '../hr-management/hr-management.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryStructure, PayrollSettings, PayrollRun, Payslip, LoanAdvance, FullFinalSettlement]),
    HrManagementModule, // for EmployeesService — the cross-module dependency PayrollRunsService and FullFinalSettlementsService both need
  ],
  controllers: [PayrollController],
  providers: [
    SalaryStructuresService,
    PayrollSettingsService,
    PayrollRunsService,
    PayslipsService,
    LoanAdvancesService,
    FullFinalSettlementsService,
  ],
  exports: [
    SalaryStructuresService,
    PayrollSettingsService,
    PayrollRunsService,
    PayslipsService,
    LoanAdvancesService,
    FullFinalSettlementsService,
  ],
})
export class PayrollModule {}