import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillHrManagerRole1726000000000 implements MigrationInterface {
  name = 'BackfillHrManagerRole1726000000000';

  private readonly hrPermissions = ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
    module: 'hr-management',
    action,
  }));

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants: Array<{ id: string }> = await queryRunner.query(`SELECT id FROM tenants`);

    for (const tenant of tenants) {
      const existing = await queryRunner.query(
        `SELECT id FROM roles WHERE tenant_id = $1 AND name = 'HR Manager' AND is_system_role = true`,
        [tenant.id],
      );
      if (existing.length > 0) continue;

      await queryRunner.query(
        `INSERT INTO roles (id, tenant_id, name, is_system_role, permissions, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 'HR Manager', true, $2::jsonb, now(), now())`,
        [tenant.id, JSON.stringify(this.hrPermissions)],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM roles WHERE name = 'HR Manager' AND is_system_role = true`);
  }
}