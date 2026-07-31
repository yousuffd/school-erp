import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PlanTier {
  STARTER = 'starter',
  GROWTH = 'growth',
  ENTERPRISE = 'enterprise',
  PLATFORM = 'platform',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}

/**
 * Tracks tier HISTORY per tenant, not just current state — changing a
 * tenant's tier closes the current row (sets ended_at) and inserts a new
 * one, rather than mutating a row in place, so "what tier was this tenant
 * on last March" stays answerable. Exactly one row per tenant should have
 * ended_at IS NULL at any time (the current tier) — enforced via a partial
 * unique index, see the migration.
 *
 * set_by is nullable: retroactively-backfilled rows for tenants that
 * existed before this table did have no real acting admin to attribute
 * (see backfill migration), and the tenant-provisioning bootstrap path
 * (API-key auth, no JWT) also has no authenticated user to attribute.
 */
@Entity('tenant_subscriptions')
export class TenantSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({ type: 'enum', enum: PlanTier })
  plan_tier: PlanTier;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  started_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at?: Date | null;

  @Column('uuid', { nullable: true })
  set_by?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
