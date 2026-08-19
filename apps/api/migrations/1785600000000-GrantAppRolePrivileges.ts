import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Closes a real RLS gap found during Day 2 tenant-isolation testing: every
 * connection this app has ever made used the `school_erp` role, which is
 * BOTH a Postgres superuser AND has rolbypassrls=true (both set automatically
 * by the official postgres Docker image via POSTGRES_USER at initdb time).
 * Postgres unconditionally skips RLS policy checks for such a role — not a
 * policy bug, the policies were correct the whole time, just never actually
 * being evaluated for any query.
 *
 * Fix: a second, non-superuser, non-bypassrls role (`school_erp_app`) that
 * the RUNNING APPLICATION connects as. Migrations keep running as
 * `school_erp` (needs elevated privileges for DDL). `school_erp_app` gets
 * only DML privileges — and, critically, is actually subject to every RLS
 * policy already defined on these 96 tables.
 *
 * ALTER DEFAULT PRIVILEGES ensures any table a FUTURE migration creates
 * (run as `school_erp`) automatically grants `school_erp_app` the same
 * DML access, without this migration needing to be re-run or remembered.
 *
 * Role creation itself is NOT here — CREATE ROLE is cluster-wide, not
 * per-database, so running it inside a per-database migration tool would
 * either fail on a second database in the same cluster or require an
 * IF NOT EXISTS workaround. It's a one-time infra step, documented in
 * PROGRESS.md, run once per Postgres cluster (dev, CI, production).
 */
export class GrantAppRolePrivileges1785600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`GRANT USAGE ON SCHEMA public TO school_erp_app;`);
    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_erp_app;`,
    );
    await queryRunner.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO school_erp_app;`);
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES FOR ROLE school_erp IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_erp_app;`,
    );
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES FOR ROLE school_erp IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO school_erp_app;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES FOR ROLE school_erp IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM school_erp_app;`,
    );
    await queryRunner.query(
      `ALTER DEFAULT PRIVILEGES FOR ROLE school_erp IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM school_erp_app;`,
    );
    await queryRunner.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM school_erp_app;`);
    await queryRunner.query(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM school_erp_app;`);
    await queryRunner.query(`REVOKE USAGE ON SCHEMA public FROM school_erp_app;`);
  }
}
