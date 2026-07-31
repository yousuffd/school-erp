import { MigrationInterface, QueryRunner } from 'typeorm';

/** Same pattern as CreateActivityCoordinatorRole — a fresh role row per existing tenant. */
export class CreateCounselorRole1727900000000 implements MigrationInterface {
  private readonly roleName = 'Counselor';
  private readonly module = 'discipline';

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
