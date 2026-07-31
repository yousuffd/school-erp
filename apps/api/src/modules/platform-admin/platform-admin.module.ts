import { Module } from '@nestjs/common';
import { PlatformAdminController } from './platform-admin.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { FeatureTogglesModule } from '../feature-toggles/feature-toggles.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TenantsModule, FeatureTogglesModule, BillingModule],
  controllers: [PlatformAdminController],
})
export class PlatformAdminModule {}
