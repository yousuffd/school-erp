import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the platform-dashboard:view permission to the Super Admin role,
 * alongside its existing tenant-provisioning:view (see
 * ScopeSuperAdminPermissionsToPlatformLevel1785000000000). This gates the
 * new /platform-admin/* route namespace (PlatformAdminModule) — no other
 * role is ever granted this module, so @Permissions({module:
 * 'platform-dashboard', action: 'view'}) alone is an effective
 * Super-Admin-only gate, enforced by the existing global RbacGuard with no
 * new guard class needed.
 */
export class GrantPlatformDashboardPermissionToSuperAdmin1785200000000 implements MigrationInterface {
  name = 'GrantPlatformDashboardPermissionToSuperAdmin1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE roles
      SET permissions = permissions || '[{"module":"platform-dashboard","action":"view"}]'::jsonb
      WHERE name = 'Super Admin' AND tenant_id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE roles
      SET permissions = (
        SELECT jsonb_agg(p) FROM jsonb_array_elements(permissions) p
        WHERE p->>'module' != 'platform-dashboard'
      )
      WHERE name = 'Super Admin' AND tenant_id IS NULL
    `);
  }
}
