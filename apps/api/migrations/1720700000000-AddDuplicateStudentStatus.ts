import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 'duplicate' as a valid Student status — a non-destructive alternative
 * to actually deleting a record created by mistake. Just adds the enum
 * label; nothing is backfilled to it (nothing should already be "duplicate").
 */
export class AddDuplicateStudentStatus1720700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "students_status_enum" ADD VALUE IF NOT EXISTS 'duplicate'`);
  }

  public async down(): Promise<void> {
    // Postgres doesn't support removing an enum value directly. Rolling this
    // back would require rebuilding the enum type from scratch (create a new
    // type without 'duplicate', migrate the column, drop the old type) —
    // deliberately not implemented since no data should ever depend on
    // reverting this, and doing it wrong risks the column itself.
  }
}
