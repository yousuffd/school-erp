import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills 'activities' permissions onto pre-existing role rows for
 * tenants provisioned before this module shipped — same gap class as
 * BackfillPayrollPermissionsOnAdminRoles: adding a module to a phase
 * matrix file only affects FUTURE tenant provisioning
 * (seedSystemRolesForTenant), never already-baked-in permissions jsonb on
 * existing role rows. Activity Coordinator itself does NOT need backfilling
 * here — it was created fresh by CreateActivityCoordinatorRole1727600000000
 * with the right permissions already set at insert time.
 */
export class BackfillActivitiesPermissionsOnExistingRoles1727700000000 implements MigrationInterface {
  private readonly fullAccessRoleNames = ['Super Admin', 'District/Trust Admin', 'School Admin'];
  private readonly viewOnlyRoleNames = ['Teacher'];

  private fullAccess(): Array<{ module: string; action: string }> {
    return ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'activities', action }));
  }

  private viewOnly(): Array<{ module: string; action: string }> {
    return [{ module: 'activities', action: 'view' }];
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles: Array<{ id: string; name: string; permissions: unknown }> = await queryRunner.query(
      `SELECT id, name, permissions FROM roles WHERE is_system_role = true`,
    );
    for (const role of roles) {
      let toAdd: Array<{ module: string; action: string }> | undefined;
      if (this.fullAccessRoleNames.includes(role.name)) toAdd = this.fullAccess();
      else if (this.viewOnlyRoleNames.includes(role.name)) toAdd = this.viewOnly();
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
      const filtered = existing.filter((p: any) => p.module !== 'activities');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [JSON.stringify(filtered), role.id]);
    }
  }
}
