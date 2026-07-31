import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes a bug in CreateExamGroups1722000000000: its RLS policy checked
 * against `app.tenant_id`, a session variable nothing in this codebase ever
 * sets. Every other tenant-isolation policy (see EnableRls1700000000000)
 * and the actual code that sets it (TenantRlsInterceptor) use
 * `app.current_tenant_id`. Left as-is, `current_setting('app.tenant_id')`
 * with no missing_ok flag throws a hard Postgres error on every single
 * query against exam_groups (SELECT/INSERT/UPDATE/DELETE alike), since a
 * custom GUC that was never SET at all raises rather than returning empty.
 */
export class FixExamGroupsRlsPolicy1722100000000 implements MigrationInterface {
  name = 'FixExamGroupsRlsPolicy1722100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY IF EXISTS "tenant_isolation_exam_groups" ON "exam_groups";

      CREATE POLICY "tenant_isolation_exam_groups" ON "exam_groups"
      USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverts to the original (broken) policy for symmetry only —
    // there's no reason you'd actually want this rolled back.
    await queryRunner.query(`
      DROP POLICY IF EXISTS "tenant_isolation_exam_groups" ON "exam_groups";

      CREATE POLICY "tenant_isolation_exam_groups" ON "exam_groups"
      USING (tenant_id = current_setting('app.tenant_id')::uuid);
    `);
  }
}
