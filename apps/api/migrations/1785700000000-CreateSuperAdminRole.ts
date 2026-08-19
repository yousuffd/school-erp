import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes a real gap found during Day 2 smoke testing: no migration has ever
 * actually CREATED the platform-level Super Admin role. It only ever came
 * into existence via the optional, dev-only `seed.ts` script — which
 * nobody runs against production, and shouldn't. Two later migrations
 * (GrantPlatformDashboardPermissionToSuperAdmin, ...WriteActionsTo...)
 * both do `UPDATE roles SET ... WHERE name = 'Super Admin'` — silently
 * updating zero rows on any database where the role was never seeded.
 * No error, no warning — just a Super Admin role that never actually
 * has the permissions those migrations intended.
 *
 * This migration creates that role from scratch, idempotently (safe to
 * run whether or not seed.ts already created it), with the full
 * cumulative permission set those two migrations were assuming was
 * already there:
 *   - tenant-provisioning: view, create, edit, delete, approve
 *     (phase0-permission-matrix.ts's fullAccess(['tenant-provisioning']))
 *   - platform-dashboard: view, edit, create
 *     (the two Grant...ToSuperAdmin migrations)
 *
 * Does NOT create a user account for this role — that's a separate,
 * deliberately non-HTTP CLI step (create-super-admin.ts), since minting
 * the platform's most powerful account shouldn't be reachable over the
 * network even behind an API key.
 */
export class CreateSuperAdminRole1785700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (tenant_id, name, is_system_role, permissions)
      SELECT
        NULL,
        'Super Admin',
        true,
        '[
          {"module":"tenant-provisioning","action":"view"},
          {"module":"tenant-provisioning","action":"create"},
          {"module":"tenant-provisioning","action":"edit"},
          {"module":"tenant-provisioning","action":"delete"},
          {"module":"tenant-provisioning","action":"approve"},
          {"module":"platform-dashboard","action":"view"},
          {"module":"platform-dashboard","action":"edit"},
          {"module":"platform-dashboard","action":"create"}
        ]'::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM roles WHERE name = 'Super Admin' AND tenant_id IS NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deliberately does NOT delete the role on rollback — by the time this
    // migration could be reverted, a real Super Admin user account may
    // already reference it via role_id, and deleting out from under a
    // real login is exactly the kind of destructive step the Master
    // Prompt requires explicit approval for, not something a routine
    // `migration:revert` should do silently.
  }
}
