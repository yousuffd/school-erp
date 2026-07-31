import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes a latent bug in every tenant_isolation_* RLS policy (96 tables,
 * confirmed via pg_policies), exposed by the Platform Super Admin login
 * work (SUPER_ADMIN_DASHBOARD_SCOPE.md §4a): binding
 * app.current_tenant_id to the empty string (required for the
 * null-tenant/platform-level branch of a handful of policies like
 * tenant_isolation_users to match at all) makes Postgres evaluate
 * ''::uuid on every OTHER policy's plain equality branch too — and
 * ''::uuid always throws `invalid input syntax for type uuid`,
 * regardless of whether the row would've matched via some other
 * condition. This was never hit before because no session ever bound
 * that session var to '' until a genuinely platform-level (null-tenant)
 * user existed.
 *
 * Fix: wrap the cast in NULLIF(..., '') so an empty-string session var
 * becomes SQL NULL *before* the cast (::uuid on NULL is always NULL, never
 * an error), and `tenant_id = NULL` is simply false — meaning a
 * platform-level Super Admin session correctly sees zero rows in every
 * purely tenant-scoped operational table (fee records, exams, attendance,
 * etc.), rather than crashing, and continues to see the right rows in the
 * few tables (users, roles, campuses, academic_years) that have an
 * explicit null-tenant branch.
 *
 * This is written as a generic loop over every policy whose USING
 * expression contains the broken substring, rather than a hardcoded list
 * of 96 table names — so it's correct today and self-healing for any
 * future table seeded with the same tenant_isolation_* pattern.
 */
export class FixNullTenantRlsCastAcrossAllPolicies1784910000000 implements MigrationInterface {
  name = 'FixNullTenantRlsCastAcrossAllPolicies1784910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        pol RECORD;
        new_qual TEXT;
      BEGIN
        FOR pol IN
          SELECT n.nspname AS schema_name, c.relname AS table_name, p.polname AS policy_name,
                 pg_get_expr(p.polqual, p.polrelid) AS qual_expr
          FROM pg_policy p
          JOIN pg_class c ON c.oid = p.polrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE pg_get_expr(p.polqual, p.polrelid) LIKE '%current_tenant_id%'
        LOOP
          new_qual := replace(
            pol.qual_expr,
            '(current_setting(''app.current_tenant_id''::text, true))::uuid',
            '(NULLIF(current_setting(''app.current_tenant_id''::text, true), ''''))::uuid'
          );
          IF new_qual <> pol.qual_expr THEN
            EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', pol.policy_name, pol.schema_name, pol.table_name, new_qual);
          END IF;
        END LOOP;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        pol RECORD;
        new_qual TEXT;
      BEGIN
        FOR pol IN
          SELECT n.nspname AS schema_name, c.relname AS table_name, p.polname AS policy_name,
                 pg_get_expr(p.polqual, p.polrelid) AS qual_expr
          FROM pg_policy p
          JOIN pg_class c ON c.oid = p.polrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE pg_get_expr(p.polqual, p.polrelid) LIKE '%current_tenant_id%'
        LOOP
          new_qual := replace(
            pol.qual_expr,
            '(NULLIF(current_setting(''app.current_tenant_id''::text, true), ''''))::uuid',
            '(current_setting(''app.current_tenant_id''::text, true))::uuid'
          );
          IF new_qual <> pol.qual_expr THEN
            EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', pol.policy_name, pol.schema_name, pol.table_name, new_qual);
          END IF;
        END LOOP;
      END $$;
    `);
  }
}
