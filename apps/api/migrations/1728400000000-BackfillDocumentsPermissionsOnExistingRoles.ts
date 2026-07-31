import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Same gap class as every other Backfill*PermissionsOnExistingRoles
 * migration this session — adding a module to a phase matrix only affects
 * FUTURE tenant provisioning. HR Manager keeps full access (continuity
 * from managing what used to be HrPolicyDocument under hr-management
 * permission) — see phase5-permission-matrix.ts's DOCUMENTS_PERMISSIONS
 * doc comment for the reasoning.
 */
export class BackfillDocumentsPermissionsOnExistingRoles1728400000000 implements MigrationInterface {
  private readonly fullAccessRoleNames = ['Super Admin', 'District/Trust Admin', 'School Admin', 'HR Manager'];
  private readonly teacherRoleNames = ['Teacher'];

  private fullAccess(): Array<{ module: string; action: string }> {
    return ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module: 'documents', action }));
  }

  private teacherAccess(): Array<{ module: string; action: string }> {
    return ['view', 'create'].map((action) => ({ module: 'documents', action }));
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
      const filtered = existing.filter((p: any) => p.module !== 'documents');
      await queryRunner.query(`UPDATE roles SET permissions = $1 WHERE id = $2`, [JSON.stringify(filtered), role.id]);
    }
  }
}
