import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Part of the Platform Super Admin login work (see
 * SUPER_ADMIN_DASHBOARD_SCOPE.md §4a). The Super Admin *role* already has a
 * NULL tenant_id (seeded that way in RolesService.seedSystemRolesForTenant /
 * database/seed.ts) — this migration brings the Super Admin *user* row in
 * line with its role, so Super Admin becomes a genuine platform-level
 * account with no home tenant, rather than one parked under Greenwood's
 * tenant_id purely as an artifact of login always requiring a subdomain.
 *
 * Two things happen here:
 *   1. users.tenant_id becomes nullable at the schema level (it's `NOT NULL`
 *      today — confirmed via `\d users`). The existing FK
 *      (FK_users_tenant ... ON DELETE CASCADE) is untouched by this — a FK
 *      is simply not checked/enforced for NULL column values in Postgres,
 *      so no FK changes are needed.
 *   2. superadmin1@demo.schoolerp.test's existing row gets tenant_id set to
 *      NULL. This is a live data change, not just a schema change — flagged
 *      explicitly since it moves a real seeded row.
 *
 * NOT covered by this migration (deliberately — application-layer changes,
 * not schema): the null-vs-undefined tenant resolution fix in
 * TenantContextMiddleware / TenantRlsInterceptor / RolesService.findOne, and
 * the LoginDto/AuthService changes to accept a subdomain-less login. Those
 * ship as regular code changes alongside this migration, not inside it.
 */
export class MakeSuperAdminUserPlatformLevel1784810000000 implements MigrationInterface {
  name = 'MakeSuperAdminUserPlatformLevel1784810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Relax the NOT NULL constraint.
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "tenant_id" DROP NOT NULL`);

    // 2. Move the existing superadmin1@ row to a null tenant, matching its
    //    role (roles.tenant_id IS NULL for the Super Admin role already).
    //    Scoped tightly by email + role name so this only ever touches the
    //    one intended row, and is a no-op (0 rows) if it's already been run
    //    or the seed data differs from what's expected — never throws.
    await queryRunner.query(`
      UPDATE "users" u
      SET "tenant_id" = NULL
      FROM "roles" r
      WHERE u."role_id" = r."id"
        AND r."name" = 'Super Admin'
        AND u."email" = 'superadmin1@demo.schoolerp.test'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: restore superadmin1@'s tenant_id to Greenwood's tenant, then
    // re-add NOT NULL. The Greenwood tenant_id is looked up by subdomain
    // rather than hardcoded, so this stays correct even if the demo
    // tenant's UUID ever changes.
    await queryRunner.query(`
      UPDATE "users" u
      SET "tenant_id" = t."id"
      FROM "tenants" t
      WHERE t."subdomain" = 'demo'
        AND u."email" = 'superadmin1@demo.schoolerp.test'
        AND u."tenant_id" IS NULL
    `);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "tenant_id" SET NOT NULL`);
  }
}
