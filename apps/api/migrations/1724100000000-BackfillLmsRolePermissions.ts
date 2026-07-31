import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills 'lms' module permissions onto system roles for tenants
 * provisioned before this module existed. Same pattern as
 * BackfillExaminationsRolePermissions.
 *
 * Student is intentionally absent from this map — unlike every other
 * module, Student access to Assignments isn't granted via the permission
 * system at all. It's enforced entirely by the ownership check in
 * AssignmentSubmissionsService (req.user.studentId must match the
 * resource), which doesn't look at this permissions array. Adding a
 * Student row here would be misleading — it would suggest permission-based
 * access exists when it doesn't.
 */
export class BackfillLmsRolePermissions1724100000000 implements MigrationInterface {
  private readonly permissionsByRoleName: Record<string, Array<{ module: string; action: string }>> = {
    'Super Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'lms', action })),
    'District/Trust Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'lms',
      action,
    })),
    'School Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'lms', action })),
    Teacher: ['view', 'create', 'edit'].map((action) => ({ module: 'lms', action })),
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
      const filtered = existing.filter((p: any) => p.module !== 'lms');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(filtered),
        role.id,
      ]);
    }
  }
}
