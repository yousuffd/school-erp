import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills 'health-wellness' module permissions onto system roles for
 * tenants provisioned before this module existed. Same pattern as
 * BackfillTransportationRolePermissions / BackfillLibraryRolePermissions.
 *
 * Unlike Library/Transportation, Teacher DOES get a row here — 'view'
 * only, no create/edit/delete. A homeroom teacher legitimately needs
 * visibility into allergy/condition flags for their own class (see
 * phase3-health-wellness-permission-matrix.ts for the full reasoning).
 * Note: this migration grants tenant-wide view at the permission-system
 * level; the actual class-scoping restriction (a Teacher only ever
 * SEEING their own students' records) is enforced in service code via a
 * dedicated scoping utility, not by this permissions array — same
 * division of responsibility as Examinations' Teacher class-scoping.
 */
export class BackfillHealthWellnessRolePermissions1724700000000 implements MigrationInterface {
  private readonly permissionsByRoleName: Record<string, Array<{ module: string; action: string }>> = {
    'Super Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'health-wellness',
      action,
    })),
    'District/Trust Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'health-wellness',
      action,
    })),
    'School Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'health-wellness',
      action,
    })),
    Teacher: [{ module: 'health-wellness', action: 'view' }],
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
      const filtered = existing.filter((p: any) => p.module !== 'health-wellness');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(filtered),
        role.id,
      ]);
    }
  }
}
