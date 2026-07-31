import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeComponent } from './entities/fee-component.entity';
import { FeeInstallment } from './entities/fee-installment.entity';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { FeeAdjustment } from './entities/fee-adjustment.entity';
import { FeePayment } from './entities/fee-payment.entity';
import { FeeStructuresService } from './fee-structures.service';
import { FeeAssignmentsService } from './fee-assignments.service';
import { FeeAdjustmentsService } from './fee-adjustments.service';
import { FeePaymentsService } from './fee-payments.service';
import { FeeStructuresController } from './fee-structures.controller';
import { FeeAssignmentsController } from './fee-assignments.controller';
import { FeeAdjustmentsController } from './fee-adjustments.controller';
import { FeePaymentsController } from './fee-payments.controller';
import { StudentsModule } from '../students/students.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeStructure,
      FeeComponent,
      FeeInstallment,
      FeeAssignment,
      FeeAdjustment,
      FeePayment,
    ]),
    StudentsModule,
    TenantsModule,
  ],
  controllers: [
    FeeStructuresController,
    FeeAssignmentsController,
    FeeAdjustmentsController,
    FeePaymentsController,
  ],
  providers: [FeeStructuresService, FeeAssignmentsService, FeeAdjustmentsService, FeePaymentsService],
  exports: [FeeStructuresService, FeeAssignmentsService, FeeAdjustmentsService, FeePaymentsService],
})
export class FeesModule {}
