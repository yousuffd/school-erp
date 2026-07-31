import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 'staff' as a valid audience_scope for circulars (Communication
 * Hub) — lets an admin publish a circular visible only to staff (Teacher/
 * Admin/HR/etc.) roles, excluded from the Parent/Student "my circulars"
 * feed. No new required field needed (unlike grade/class), since
 * findForStudent()'s inclusion-only OR conditions already exclude any
 * scope other than whole_school/grade/class by construction — adding this
 * enum value is the only change needed at the data layer.
 *
 * Postgres enum values can only be added, never removed, within a single
 * ALTER TYPE statement — and ADD VALUE cannot run inside the same
 * transaction block as a query that uses the new value, so this migration
 * only adds it and takes no further action.
 */
export class AddStaffToCircularsAudienceScope1784710000000 implements MigrationInterface {
  name = 'AddStaffToCircularsAudienceScope1784710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "circulars_audience_scope_enum" ADD VALUE IF NOT EXISTS 'staff';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing a value from an existing enum
    // type directly. A true rollback would require recreating the enum
    // type without 'staff' and migrating every dependent column over to
    // it — a heavier operation than this migration's forward change
    // warrants, and unnecessary unless a 'staff'-scoped row already exists
    // and must be reverted. Left as a no-op, matching the low-risk,
    // additive nature of this change.
  }
}
