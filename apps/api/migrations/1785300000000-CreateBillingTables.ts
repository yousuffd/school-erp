import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase B of the Platform Super Admin Dashboard (SUPER_ADMIN_DASHBOARD_SCOPE.md
 * §3/§5) — billing/subscription data model. Two new tables:
 *
 *   tenant_subscriptions — tier HISTORY per tenant (see entity doc comment).
 *   The partial unique index enforces "at most one current (ended_at IS
 *   NULL) row per tenant" at the DB level, not just in application logic.
 *
 *   payment_records — manually-recorded payments, no gateway integration.
 *
 * Every existing tenant is retroactively backfilled onto 'starter' (decided
 * this session) — set_by is NULL for these rows since no real admin action
 * produced them; new tenants get their initial row created explicitly
 * during provisioning instead (TenantsService.provision(), separate code
 * change, not part of this migration).
 */
export class CreateBillingTables1785300000000 implements MigrationInterface {
  name = 'CreateBillingTables1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "plan_tier_enum" AS ENUM ('starter', 'growth', 'enterprise', 'platform')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscription_status_enum" AS ENUM ('active', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TABLE "tenant_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "plan_tier" "plan_tier_enum" NOT NULL,
        "status" "subscription_status_enum" NOT NULL DEFAULT 'active',
        "started_at" timestamptz NOT NULL DEFAULT now(),
        "ended_at" timestamptz,
        "set_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_tenant_subscriptions_current"
      ON "tenant_subscriptions" ("tenant_id")
      WHERE "ended_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TYPE "payment_mode_enum" AS ENUM ('bank_transfer', 'card', 'cheque', 'invoice', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE "payment_records" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "payment_mode" "payment_mode_enum" NOT NULL,
        "amount" numeric NOT NULL,
        "payment_date" date NOT NULL,
        "notes" text,
        "recorded_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Retroactive backfill — every existing tenant defaults to 'starter'.
    await queryRunner.query(`
      INSERT INTO "tenant_subscriptions" ("tenant_id", "plan_tier", "status", "set_by")
      SELECT "id", 'starter', 'active', NULL FROM "tenants"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_records"`);
    await queryRunner.query(`DROP TYPE "payment_mode_enum"`);
    await queryRunner.query(`DROP INDEX "UQ_tenant_subscriptions_current"`);
    await queryRunner.query(`DROP TABLE "tenant_subscriptions"`);
    await queryRunner.query(`DROP TYPE "subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE "plan_tier_enum"`);
  }
}
