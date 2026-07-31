import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Grants student-lifecycle:view onto the already-existing Hostel Admin role
 * for already-provisioned tenants. New tenants get this automatically via
 * phase1-permission-matrix.ts's updated PHASE_1_ROLE_PERMISSIONS; this
 * migration exists only to catch up tenants whose Hostel Admin role was
 * already created by BackfillHostelAdminRole1725600000000, before this
 * grant existed. Deliberately view-only, matching Teacher's own precedent
 * on this module — Hostel Admin can resolve/browse student names but still
 * cannot create, edit, or delete student records.
 */
export class BackfillStudentLifecycleViewForHostelAdmin1725800000000 implements MigrationInterface {
  private readonly grant = [{ module: 'student-lifecycle', action: 'view' }];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, permissions FROM roles WHERE is_system_role = true AND name = 'Hostel Admin'`,
    );
    for (const role of roles) {
      const existing = Array.isArray(role.permissions) ? role.permissions : [];
      const existingKeys = new Set(existing.map((p: any) => `${p.module}:${p.action}`));
      const merged = [...existing, ...this.grant.filter((p) => !existingKeys.has(`${p.module}:${p.action}`))];
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(merged),
        role.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, permissions FROM roles WHERE is_system_role = true AND name = 'Hostel Admin'`,
    );
    for (const role of roles) {
      const existing = Array.isArray(role.permissions) ? role.permissions : [];
      const filtered = existing.filter((p: any) => !(p.module === 'student-lifecycle' && p.action === 'view'));
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [
        JSON.stringify(filtered),
        role.id,
      ]);
    }
  }
}