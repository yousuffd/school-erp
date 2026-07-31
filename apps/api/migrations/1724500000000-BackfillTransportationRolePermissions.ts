import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills 'transportation' module permissions onto system roles for
 * tenants provisioned before this module existed. Same pattern as
 * BackfillLibraryRolePermissions / BackfillLmsRolePermissions.
 *
 * Only Super Admin / District Admin / School Admin get rows here — no
 * Teacher entry, matching the Library precedent (no Transport Manager
 * system role exists, and there's no "this is literally the Teacher's
 * job" case the way there is for Attendance/Examinations).
 *
 * Student is also intentionally absent — any future Student self-service
 * (e.g. "my bus route/stop") would be enforced via an ownership check,
 * not this permission system.
 */
export class BackfillTransportationRolePermissions1724500000000 implements MigrationInterface {
  private readonly permissionsByRoleName: Record<string, Array<{ module: string; action: string }>> = {
    'Super Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'transportation',
      action,
    })),
    'District/Trust Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'transportation',
      action,
    })),
    'School Admin': ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({
      module: 'transportation',
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
      const filtered = existing.filter((p: any) => p.module !== 'transportation');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(filtered),
        role.id,
      ]);
    }
  }
}
