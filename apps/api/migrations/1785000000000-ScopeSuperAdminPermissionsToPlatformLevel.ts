import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The platform Super Admin role (tenant_id IS NULL) had accumulated full
 * CRUD access to EVERY module — including payroll, hr-management, and
 * every operational module — as a side effect of 19+ Backfill*RolePermissions
 * migrations, each of which selected `WHERE is_system_role = true` with no
 * `tenant_id IS NOT NULL` exclusion. Confirmed live: 115 permissions across
 * 21 modules on the one platform Super Admin role row before this migration.
 *
 * This was never an intentional grant — Super Admin is meant to be a
 * platform operator (tenant provisioning, eventually cross-tenant billing/
 * dashboard views), never a viewer of any tenant's operational or
 * compensation data. RLS already fails this closed for most tables (a
 * null-tenant session sees zero rows on any table without an explicit
 * null-tenant branch), but the permissions array itself should reflect
 * intent, not rely on RLS alone — and RbacGuard's `roleName === 'Super
 * Admin'` bypass (removed alongside this migration, see guard changes)
 * previously made this array's contents irrelevant anyway, which is how
 * this went unnoticed.
 *
 * Replaces (not merges) the permissions array with only what's genuinely
 * consumed by a real route today: GET /tenants and GET /tenants/:id both
 * require tenant-provisioning:view via @Permissions() (TenantsController).
 * POST /tenants (create) is gated by TenantProvisioningGuard directly and
 * never reads this array. As future /platform-admin/* dashboard endpoints
 * are built, they should declare their own @Permissions() and this array
 * grows deliberately — not by another blanket backfill.
 */
export class ScopeSuperAdminPermissionsToPlatformLevel1785000000000 implements MigrationInterface {
  name = 'ScopeSuperAdminPermissionsToPlatformLevel1785000000000';

  private readonly platformPermissions = [
    { module: 'tenant-provisioning', action: 'view' },
  ];

  // Captured from the live row at time of writing — see this migration's
  // docstring. Used only to make `down` a genuine reversal rather than a
  // guess; NOT re-derived from the phase matrices, since those may drift
  // from what was actually backfilled onto this specific row over time.
  private readonly previousModules = [
    'academic-management', 'activities', 'admissions', 'alumni', 'attendance',
    'cafeteria', 'communication', 'core-admin', 'discipline', 'documents',
    'examinations', 'fee-management', 'health-wellness', 'hostel',
    'hr-management', 'inventory-assets', 'library', 'lms', 'payroll',
    'student-lifecycle', 'tenant-provisioning',
  ];
  private readonly previousActions = ['view', 'create', 'edit', 'delete', 'approve'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE roles SET permissions = $1 WHERE name = 'Super Admin' AND tenant_id IS NULL`,
      [JSON.stringify(this.platformPermissions)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const restored = this.previousModules.flatMap((module) =>
      this.previousActions.map((action) => ({ module, action })),
    );
    await queryRunner.query(
      `UPDATE roles SET permissions = $1 WHERE name = 'Super Admin' AND tenant_id IS NULL`,
      [JSON.stringify(restored)],
    );
  }
}
