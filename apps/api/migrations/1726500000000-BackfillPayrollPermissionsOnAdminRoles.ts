import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPayrollPermissionsOnAdminRoles1726500000000 implements MigrationInterface {
  private readonly permissionsByRoleName: Record<string, Array<{ module: string; action: string }>> = {
    'Super Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'payroll', action })),
    'District/Trust Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'payroll', action })),
    'School Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'payroll', action })),
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; name: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, name, permissions FROM roles WHERE is_system_role = true`,
    );
    for (const role of roles) {
      const toAdd = this.permissionsByRoleName[role.name];
      if (!toAdd) continue;
      const existing = Array.isArray(role.permissions) ? role.permissions : [];
      const existingKeys = new Set(existing.map((p: any) => `${p.module}:${p.action}`));
      const merged = [...existing, ...toAdd.filter((p) => !existingKeys.has(`${p.module}:${p.action}`))];
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [JSON.stringify(merged), role.id]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, permissions FROM roles WHERE is_system_role = true`,
    );
    for (const role of roles) {
      const existing = Array.isArray(role.permissions) ? role.permissions : [];
      const filtered = existing.filter((p: any) => p.module !== 'payroll');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [JSON.stringify(filtered), role.id]);
    }
  }
}