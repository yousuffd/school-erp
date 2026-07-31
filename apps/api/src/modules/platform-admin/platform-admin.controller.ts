import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TenantsService } from '../tenants/tenants.service';
import { FeatureTogglesService } from '../feature-toggles/feature-toggles.service';
import { BillingService } from '../billing/billing.service';
import { ChangeTierDto } from '../billing/dto/change-tier.dto';
import { RecordPaymentDto } from '../billing/dto/record-payment.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Platform-level namespace for the SaaS provider's own operator view (see
 * SUPER_ADMIN_LOGIN_SCOPE.md §4.1). Every route here must only ever touch
 * platform-level data (tenants, cross-tenant toggle summaries, billing) —
 * never a tenant's operational tables (students, staff, fees, payroll,
 * etc.). Gated by @Permissions({module: 'platform-dashboard', ...}), a
 * module granted only to the Super Admin role — no separate guard class
 * needed, this rides the existing global RbacGuard.
 */
@ApiTags('platform-admin')
@ApiBearerAuth()
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly featureTogglesService: FeatureTogglesService,
    private readonly billingService: BillingService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get('ping')
  @Permissions({ module: 'platform-dashboard', action: 'view' })
  ping() {
    return { ok: true, scope: 'platform-level', message: 'platform-admin namespace is wired up' };
  }

  @Get('tenants')
  @Permissions({ module: 'platform-dashboard', action: 'view' })
  getTenants() {
    return this.tenantsService.findAll();
  }

  @Get('tenants/:id/toggles')
  @Permissions({ module: 'platform-dashboard', action: 'view' })
  getTenantToggles(@Param('id') id: string) {
    return this.featureTogglesService.listForTenantAsPlatformAdmin(id);
  }

  @Get('tenants/:id/subscription')
  @Permissions({ module: 'platform-dashboard', action: 'view' })
  getSubscription(@Param('id') id: string) {
    return this.billingService.getCurrentSubscription(id);
  }

  @Patch('tenants/:id/subscription')
  @Permissions({ module: 'platform-dashboard', action: 'edit' })
  async changeTier(
    @Param('id') id: string,
    @Body() dto: ChangeTierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // No ambient RLS-scoped manager exists for platform-level requests
    // (Super Admin's own session never opens tenant-scoped RLS wrapping —
    // see TenantRlsInterceptor's null-tenant handling), so this opens its
    // own manager directly for changeTier()'s transaction, same pattern as
    // RolesService.findOne()'s dedicated-connection approach elsewhere.
    return this.dataSource.transaction((manager) =>
      this.billingService.changeTier(id, dto.plan_tier, user?.userId, manager),
    );
  }

  @Get('tenants/:id/payments')
  @Permissions({ module: 'platform-dashboard', action: 'view' })
  getPayments(@Param('id') id: string) {
    return this.billingService.listPayments(id);
  }

  @Post('tenants/:id/payments')
  @Permissions({ module: 'platform-dashboard', action: 'create' })
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.billingService.recordPayment(id, dto, user?.userId);
  }

  @Patch('tenants/:id/payments/:paymentId/void')
  @Permissions({ module: 'platform-dashboard', action: 'edit' })
  voidPayment(@Param('paymentId') paymentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.billingService.voidPayment(paymentId, user?.userId);
  }

  @Post('tenants/:id/subscription/cancel')
  @Permissions({ module: 'platform-dashboard', action: 'edit' })
  async cancelSubscription(@Param('id') id: string) {
    await this.dataSource.transaction((manager) => this.billingService.cancelSubscription(id, manager));
    return { cancelled: true };
  }
}
