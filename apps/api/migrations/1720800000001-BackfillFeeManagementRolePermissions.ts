import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills the new `fee-management` module permissions onto system roles
 * for tenants provisioned before this module existed. Same pattern as the
 * four earlier Phase 1 backfills. Teacher gets nothing here — the
 * blueprint's role list for Fee Management is "Accountant, Admin, Parent,"
 * not Teacher.
 */
export class BackfillFeeManagementRolePermissions1720800000001 implements MigrationInterface {
  private readonly permissionsByRoleName: Record<string, Array<{ module: string; action: string }>> = {
    'Super Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'fee-management',
      action,
    })),
    'District/Trust Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'fee-management',
      action,
    })),
    'School Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'fee-management',
      action,
    })),
    // Teacher, Parent, Student intentionally get nothing — see phase1-permission-matrix.ts.
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

      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(merged),
        role.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, permissions FROM roles WHERE is_system_role = true`,
    );
    for (const role of roles) {
      const existing = Array.isArray(role.permissions) ? role.permissions : [];
      const filtered = existing.filter((p: any) => p.module !== 'fee-management');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(filtered),
        role.id,
      ]);
    }
  }
}
