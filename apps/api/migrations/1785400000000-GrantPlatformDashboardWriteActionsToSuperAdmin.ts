import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Super Admin previously only had platform-dashboard:view (see
 * GrantPlatformDashboardPermissionToSuperAdmin1785200000000). Phase B's
 * write endpoints (change tier, record payment) need :edit and :create on
 * the same module — added here rather than folded into the earlier
 * migration since that one is already applied and this is a genuinely new,
 * separate grant.
 */
export class GrantPlatformDashboardWriteActionsToSuperAdmin1785400000000 implements MigrationInterface {
  name = 'GrantPlatformDashboardWriteActionsToSuperAdmin1785400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE roles
      SET permissions = permissions || '[
        {"module":"platform-dashboard","action":"edit"},
        {"module":"platform-dashboard","action":"create"}
      ]'::jsonb
      WHERE name = 'Super Admin' AND tenant_id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE roles
      SET permissions = (
        SELECT jsonb_agg(p) FROM jsonb_array_elements(permissions) p
        WHERE NOT (p->>'module' = 'platform-dashboard' AND p->>'action' IN ('edit', 'create'))
      )
      WHERE name = 'Super Admin' AND tenant_id IS NULL
    `);
  }
}
