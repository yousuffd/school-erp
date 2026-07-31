import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inserts a new Activity Coordinator role row for every tenant that already
 * has system roles seeded — same pattern as
 * CreateLibraryTransportationCafeteriaAdminRoles (a fresh row per tenant,
 * not an update to an existing one, since this role never existed before).
 * Full CRUD on 'activities' only, no cross-module grant — same precedent
 * as every other module-specific admin role.
 */
export class CreateActivityCoordinatorRole1727600000000 implements MigrationInterface {
  private readonly roleName = 'Activity Coordinator';
  private readonly module = 'activities';

  private fullAccess(module: string): Array<{ module: string; action: string }> {
    return ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module, action }));
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants: Array<{ tenant_id: string }> = await queryRunner.query(
      `SELECT DISTINCT tenant_id FROM roles WHERE is_system_role = true AND tenant_id IS NOT NULL`,
    );

    for (const { tenant_id } of tenants) {
      const existing = await queryRunner.query(
        `SELECT id FROM roles WHERE tenant_id = $1 AND name = $2 AND is_system_role = true`,
        [tenant_id, this.roleName],
      );
      if (existing.length > 0) continue;

      await queryRunner.query(
        `INSERT INTO roles (id, tenant_id, name, is_system_role, permissions, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, true, $3, now(), now())`,
        [tenant_id, this.roleName, JSON.stringify(this.fullAccess(this.module))],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM roles WHERE is_system_role = true AND name = $1`, [this.roleName]);
  }
}
