import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { TenantProvisioningGuard } from '../../common/guards/tenant-provisioning.guard';
import { BillingModule } from '../billing/billing.module';

@Module({
  // AuthModule added so TenantProvisioningGuard can inject JwtService
  // (exported by AuthModule's JwtModule.registerAsync()). This IS now a
  // genuine circular dependency (AuthModule needs TenantsService for
  // subdomain-based login, added when the login flow switched from raw
  // tenant_id to subdomain) — forwardRef() on both sides resolves it;
  // the previous "no circular risk" comment here is now stale/incorrect
  // and has been corrected.
  imports: [TypeOrmModule.forFeature([Tenant]), RolesModule, UsersModule, BillingModule, forwardRef(() => AuthModule)],
  controllers: [TenantsController],
  providers: [TenantsService, TenantProvisioningGuard],
  exports: [TenantsService],
})
export class TenantsModule {}
