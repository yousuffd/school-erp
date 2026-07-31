import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TenantSubscription, PlanTier, SubscriptionStatus } from './entities/tenant-subscription.entity';
import { PaymentRecord, PaymentMode } from './entities/payment-record.entity';

/**
 * Deliberately does NOT use scopedRepo()/RLS at all — every method here
 * takes an explicit tenantId and is only ever reached through
 * PlatformAdminController, already gated by @Permissions({module:
 * 'platform-dashboard'}). This is genuine cross-tenant platform-level
 * data, same reasoning as FeatureTogglesService.listForTenantAsPlatformAdmin.
 * tenant_subscriptions/payment_records have no RLS policy at all (unlike
 * every tenant-operational table) — they're platform data, not
 * tenant-scoped data, so there's nothing to bypass here in the first place.
 */
@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(TenantSubscription) private readonly subRepo: Repository<TenantSubscription>,
    @InjectRepository(PaymentRecord) private readonly paymentRepo: Repository<PaymentRecord>,
  ) {}

  async getCurrentSubscription(tenantId: string): Promise<TenantSubscription> {
    const sub = await this.subRepo.findOne({ where: { tenant_id: tenantId, ended_at: null as any } });
    if (!sub) throw new NotFoundException(`No active subscription found for tenant ${tenantId}`);
    return sub;
  }

  /**
   * Closes the current row (sets ended_at) and inserts a new one — never
   * mutates plan_tier in place, so tier history stays intact (see entity
   * doc comment). Both writes happen in one transaction so a failure
   * partway through can't leave a tenant with either zero or two "current"
   * rows.
   */
  async changeTier(
    tenantId: string,
    newTier: PlanTier,
    setBy: string | undefined,
    manager: EntityManager,
  ): Promise<TenantSubscription> {
    return manager.transaction(async (txManager) => {
      const current = await txManager
        .createQueryBuilder(TenantSubscription, 'sub')
        .setLock('pessimistic_write')
        .where('sub.tenant_id = :tenantId', { tenantId })
        .andWhere('sub.ended_at IS NULL')
        .getOne();
      if (current) {
        current.ended_at = new Date();
        await txManager.save(TenantSubscription, current);
      }
      const next = txManager.create(TenantSubscription, {
        tenant_id: tenantId,
        plan_tier: newTier,
        set_by: setBy ?? null,
      });
      return txManager.save(TenantSubscription, next);
    });
  }

  /**
   * Called during tenant provisioning (TenantsService.provision(), inside
   * its own transaction) — accepts the caller's manager so this becomes
   * part of that same all-or-nothing transaction, same pattern as
   * RolesService.seedSystemRolesForTenant's manager parameter.
   */
  async createInitialSubscription(
    tenantId: string,
    planTier: PlanTier,
    setBy: string | undefined,
    manager: EntityManager,
  ): Promise<TenantSubscription> {
    const sub = manager.create(TenantSubscription, {
      tenant_id: tenantId,
      plan_tier: planTier,
      set_by: setBy ?? null,
    });
    return manager.save(TenantSubscription, sub);
  }

  async listPayments(tenantId: string): Promise<PaymentRecord[]> {
    return this.paymentRepo.find({ where: { tenant_id: tenantId }, order: { payment_date: 'DESC' } });
  }

  async recordPayment(
    tenantId: string,
    payload: { payment_mode: PaymentMode; amount: string; payment_date: string; notes?: string },
    recordedBy: string | undefined,
  ): Promise<PaymentRecord> {
    const payment = this.paymentRepo.create({
      tenant_id: tenantId,
      ...payload,
      recorded_by: recordedBy ?? null,
    });
    return this.paymentRepo.save(payment);
  }

  /**
   * Soft-delete only (decided this session) — never hard-deletes a payment
   * row, preserving it for audit purposes. A "correction" is voiding the
   * old entry and recording a new one via recordPayment(), not an in-place
   * edit of this row.
   */
  async voidPayment(paymentId: string, voidedBy: string | undefined): Promise<PaymentRecord> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.voided_at) throw new BadRequestException('Payment is already voided');
    payment.voided_at = new Date();
    payment.voided_by = voidedBy ?? null;
    return this.paymentRepo.save(payment);
  }

  /**
   * Closes the current subscription row (ended_at set) WITHOUT opening a
   * replacement — decided this session: a cancelled tenant has no active
   * tier at all until a Super Admin explicitly sets a new one via
   * changeTier(). getCurrentSubscription() then correctly throws
   * NotFoundException for a cancelled tenant, same as it would for one
   * that (hypothetically) never had a subscription row at all — both
   * mean "no current tier", which is exactly the state we want.
   */
  async cancelSubscription(tenantId: string, manager: EntityManager): Promise<void> {
    const current = await manager
      .createQueryBuilder(TenantSubscription, 'sub')
      .setLock('pessimistic_write')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .andWhere('sub.ended_at IS NULL')
      .getOne();
    if (!current) throw new NotFoundException(`No active subscription found for tenant ${tenantId}`);
    current.ended_at = new Date();
    current.status = SubscriptionStatus.CANCELLED;
    await manager.save(TenantSubscription, current);
  }
}
