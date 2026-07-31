import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes a real RLS policy bug on 'roles', found while testing Super Admin
 * login for the first time since real RLS enforcement began (session 25).
 *
 * The original policy's NULL-tenant branch was:
 *   (tenant_id IS NULL) AND (current_setting('app.current_tenant_id', true) = '')
 * — meaning a NULL-tenant row (Super Admin's role) was only visible when NO
 * tenant context was set at all. The moment any real tenant_id is set
 * (which login always does, to find the User row), that branch goes false,
 * and the main branch (tenant_id = <uuid>) is also false since the row's
 * tenant_id genuinely IS NULL — so the row disappears entirely, regardless
 * of RolesService.findOne()'s own app-level `OR tenant_id IS NULL` clause,
 * which RLS overrides independently.
 *
 * Fixed to match findOne()'s actual intent: a NULL-tenant role should be
 * visible under ANY tenant context, not only when none is set — Super
 * Admin's role is a shared, cross-tenant resource by design.
 */
export class FixRolesRlsPolicyForNullTenant1726700000000 implements MigrationInterface {
  name = 'FixRolesRlsPolicyForNullTenant1726700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY "tenant_isolation_roles" ON "roles"`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_roles" ON "roles"
      USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR tenant_id IS NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY "tenant_isolation_roles" ON "roles"`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_roles" ON "roles"
      USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '')
      )
    `);
  }
}