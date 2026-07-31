import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inserts three NEW role rows (Library Admin, Transportation Admin,
 * Cafeteria Admin) for every tenant that already has system roles seeded —
 * unlike Backfill*RolePermissions migrations, which only update permissions
 * on EXISTING role rows, this module never had a dedicated system role at
 * all before now, so there's no existing row to update; a fresh row must
 * be inserted per tenant instead. Mirrors seedSystemRolesForTenant's own
 * per-role permission computation for new tenants going forward — this
 * migration exists only to catch tenants provisioned BEFORE this session.
 *
 * Each new role gets full CRUD on exactly its own module, nothing else —
 * same "no cross-module grant" precedent as Hostel Admin. Permission
 * arrays are hardcoded here (not imported from the live phase3 matrix)
 * deliberately: a migration should be a self-contained historical snapshot,
 * not silently drift if the matrix file changes again later.
 */
export class CreateLibraryTransportationCafeteriaAdminRoles1727100000000
  implements MigrationInterface
{
  private readonly rolesToCreate: Array<{ name: string; module: string }> = [
    { name: 'Library Admin', module: 'library' },
    { name: 'Transportation Admin', module: 'transportation' },
    { name: 'Cafeteria Admin', module: 'cafeteria' },
  ];

  private fullAccess(module: string): Array<{ module: string; action: string }> {
    return ['view', 'create', 'edit', 'delete', 'approve'].map((action) => ({ module, action }));
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tenants: Array<{ tenant_id: string }> = await queryRunner.query(
      `SELECT DISTINCT tenant_id FROM roles WHERE is_system_role = true AND tenant_id IS NOT NULL`,
    );

    for (const { tenant_id } of tenants) {
      for (const { name, module } of this.rolesToCreate) {
        const existing = await queryRunner.query(
          `SELECT id FROM roles WHERE tenant_id = $1 AND name = $2 AND is_system_role = true`,
          [tenant_id, name],
        );
        if (existing.length > 0) continue; // idempotent — skip if already present

        await queryRunner.query(
          `INSERT INTO roles (id, tenant_id, name, is_system_role, permissions, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, true, $3, now(), now())`,
          [tenant_id, name, JSON.stringify(this.fullAccess(module))],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const names = this.rolesToCreate.map((r) => r.name);
    await queryRunner.query(
      `DELETE FROM roles WHERE is_system_role = true AND name = ANY($1)`,
      [names],
    );
  }
}