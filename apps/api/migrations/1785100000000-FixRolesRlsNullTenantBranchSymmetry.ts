import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * tenant_isolation_roles was the one policy (of the four with an explicit
 * null-tenant branch: users, roles, campuses, academic_years) missing the
 * `AND current_setting('app.current_tenant_id', true) = ''` guard on its
 * null-tenant OR clause — confirmed via pg_policies. The other three all
 * require the SESSION itself to be platform-level before a null-tenant row
 * becomes visible; roles' policy exposed null-tenant rows (i.e. the
 * platform Super Admin role, name + permissions jsonb) to ANY tenant
 * session, not just a genuine platform-level one.
 *
 * No PII in that specific row (no names/emails), but the invariant "the
 * null branch only ever fires for a genuine platform session" should hold
 * everywhere without exception — this brings roles in line with the other
 * three.
 */
export class FixRolesRlsNullTenantBranchSymmetry1785100000000 implements MigrationInterface {
  name = 'FixRolesRlsNullTenantBranchSymmetry1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER POLICY tenant_isolation_roles ON roles
      USING (
        (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
        OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER POLICY tenant_isolation_roles ON roles
      USING (
        (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid)
        OR (tenant_id IS NULL)
      )
    `);
  }
}
