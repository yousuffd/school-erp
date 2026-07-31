import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills the new `examinations` module permissions onto system roles for
 * tenants provisioned before this module existed. Same pattern as every
 * earlier Phase 1 backfill — this is the first Phase 2 one.
 */
export class BackfillExaminationsRolePermissions1721000000001 implements MigrationInterface {
  private readonly permissionsByRoleName: Record<string, Array<{ module: string; action: string }>> = {
    'Super Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'examinations',
      action,
    })),
    'District/Trust Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'examinations',
      action,
    })),
    'School Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'examinations',
      action,
    })),
    Teacher: ['view', 'create', 'edit'].map((action) => ({ module: 'examinations', action })),
    // Parent and Student intentionally get nothing — see phase2-permission-matrix.ts.
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
      const filtered = existing.filter((p: any) => p.module !== 'examinations');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(filtered),
        role.id,
      ]);
    }
  }
}
