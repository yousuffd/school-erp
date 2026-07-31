import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills 'library' module permissions onto system roles for tenants
 * provisioned before this module existed. Same pattern as
 * BackfillLmsRolePermissions / BackfillExaminationsRolePermissions.
 *
 * Unlike those two, only Super Admin / District Admin / School Admin get
 * rows here — no Teacher entry. This build has no dedicated Librarian
 * system role, and unlike Attendance/Examinations there's no "this is
 * literally the Teacher's job" case for Library circulation, so Library
 * staff-level access stays Admin-tier only (see
 * phase3-library-permission-matrix.ts for the full reasoning).
 *
 * Student is also intentionally absent — same reasoning as the LMS
 * backfill: any future Student "my borrowed books" view would be enforced
 * via an ownership check, not this permission system.
 */
export class BackfillLibraryRolePermissions1724300000000 implements MigrationInterface {
  private readonly permissionsByRoleName: Record<string, Array<{ module: string; action: string }>> = {
    'Super Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'library',
      action,
    })),
    'District/Trust Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'library',
      action,
    })),
    'School Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'library',
      action,
    })),
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
      const filtered = existing.filter((p: any) => p.module !== 'library');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(filtered),
        role.id,
      ]);
    }
  }
}
