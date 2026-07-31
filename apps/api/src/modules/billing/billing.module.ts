import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSubscription } from './entities/tenant-subscription.entity';
import { PaymentRecord } from './entities/payment-record.entity';
import { BillingService } from './billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantSubscription, PaymentRecord])],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
