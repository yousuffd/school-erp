import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enables Postgres Row-Level Security on every tenant-scoped table (Blueprint §4.3:
 * "Small tenants (Starter tier): shared database, Postgres Row-Level Security (RLS)
 * keyed on tenant_id"). The app sets `app.current_tenant_id` per-connection (see
 * common/context + a TypeORM query-runner hook wired in a later sprint); until that
 * hook lands, treat RLS as defense-in-depth alongside the tenant_id filters already
 * applied in every service method — do not rely on RLS alone yet.
 */
export class EnableRls1700000000000 implements MigrationInterface {
  private readonly tenantScopedTables = ['campuses', 'academic_years', 'roles', 'users'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tenantScopedTables) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      // roles.tenant_id is nullable (platform Super Admin role) so it must also match NULL
      // when no tenant context is set, i.e. platform-level requests.
      await queryRunner.query(`
        CREATE POLICY tenant_isolation_${table} ON "${table}"
        USING (
          tenant_id = current_setting('app.current_tenant_id', true)::uuid
          OR (tenant_id IS NULL AND current_setting('app.current_tenant_id', true) = '')
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tenantScopedTables) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}";`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
    }
  }
}
