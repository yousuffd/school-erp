import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Same gap class as BackfillActivitiesPermissionsOnExistingRoles — adding
 * a module to a phase matrix file only affects FUTURE tenant provisioning,
 * never already-baked-in permissions jsonb on existing role rows.
 * Counselor itself does NOT need backfilling — created fresh by
 * CreateCounselorRole1727900000000 with correct permissions at insert time.
 */
export class BackfillDisciplinePermissionsOnExistingRoles1728000000000 implements MigrationInterface {
  private readonly fullAccessRoleNames = ['Super Admin', 'District/Trust Admin', 'School Admin'];
  private readonly teacherRoleNames = ['Teacher'];

  private fullAccess(): Array<{ module: string; action: string }> {
    return ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'discipline', action }));
  }

  /** Teacher can report incidents and view them, but not edit/delete/approve — matches blueprint's Class Teacher role. */
  private teacherAccess(): Array<{ module: string; action: string }> {
    return ['view', 'create'].map((action) => ({ module: 'discipline', action }));
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; name: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, name, permissions FROM roles WHERE is_system_role = true`,
    );
    for (const role of roles) {
      let toAdd: Array<{ module: string; action: string }> | undefined;
      if (this.fullAccessRoleNames.includes(role.name)) toAdd = this.fullAccess();
      else if (this.teacherRoleNames.includes(role.name)) toAdd = this.teacherAccess();
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
      const filtered = existing.filter((p: any) => p.module !== 'discipline');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [JSON.stringify(filtered), role.id]);
    }
  }
}
