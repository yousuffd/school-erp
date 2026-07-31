import { MigrationInterface, QueryRunner } from 'typeorm';

/** Same gap class as every other Backfill*PermissionsOnExistingRoles migration this session. Admin-only, no Teacher grant. */
export class BackfillAlumniPermissionsOnExistingRoles1728600000000 implements MigrationInterface {
  private readonly fullAccessRoleNames = ['Super Admin', 'District/Trust Admin', 'School Admin'];

  private fullAccess(): Array<{ module: string; action: string }> {
    return ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'alumni', action }));
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; name: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, name, permissions FROM roles WHERE is_system_role = true`,
    );
    for (const role of roles) {
      if (!this.fullAccessRoleNames.includes(role.name)) continue;
      const toAdd = this.fullAccess();
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
      const filtered = existing.filter((p: any) => p.module !== 'alumni');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [JSON.stringify(filtered), role.id]);
    }
  }
}
