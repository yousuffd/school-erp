import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Different in kind from every prior Backfill*RolePermissions migration
 * (Lms/Library/Transportation/HealthWellness/InventoryAssets/Cafeteria),
 * which all added permissions to EXISTING roles for already-provisioned
 * tenants. This is the first migration that inserts a brand-new Role row
 * per tenant — Hostel Admin (SystemRoleName.HOSTEL_ADMIN) didn't exist as
 * a concept before this session. New tenants provisioned after this
 * ships get it automatically via RolesService.seedSystemRolesForTenant()
 * (Object.values(SystemRoleName) already includes it once the enum
 * changed) — this migration exists only to catch up tenants that already
 * existed before that enum change landed.
 *
 * Idempotent: skips any tenant that already has a 'Hostel Admin' role
 * (safe to re-run, matches the project's general idempotency convention —
 * see Cafeteria's meal-attendance re-submit).
 */
export class BackfillHostelAdminRole1725600000000 implements MigrationInterface {
  name = 'BackfillHostelAdminRole1725600000000';

  private readonly hostelPermissions = ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
    module: 'hostel',
    action,
  }));

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants: Array<{ id: string }> = await queryRunner.query(`SELECT id FROM tenants`);

    for (const tenant of tenants) {
      const existing = await queryRunner.query(
        `SELECT id FROM roles WHERE tenant_id = $1 AND name = 'Hostel Admin' AND is_system_role = true`,
        [tenant.id],
      );
      if (existing.length > 0) continue;

      await queryRunner.query(
        `INSERT INTO roles (id, tenant_id, name, is_system_role, permissions, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 'Hostel Admin', true, $2::jsonb, now(), now())`,
        [tenant.id, JSON.stringify(this.hostelPermissions)],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM roles WHERE name = 'Hostel Admin' AND is_system_role = true`);
  }
}