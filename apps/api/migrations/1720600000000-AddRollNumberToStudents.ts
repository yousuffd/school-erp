import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Student.roll_number (auto-assigned only — never client-settable) and
 * a partial unique constraint enforcing "no two students in the same class
 * share a roll number" at the database level, not just in application code.
 * Backfills sequential roll numbers for students who already have a
 * school_class_id (from the earlier LinkStudentsToClasses migration),
 * ordered by last name for a stable, predictable assignment.
 */
export class AddRollNumberToStudents1720600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "students" ADD COLUMN "roll_number" integer`);

    const classIds: Array<{ school_class_id: string }> = await queryRunner.query(`
      SELECT DISTINCT school_class_id FROM students WHERE school_class_id IS NOT NULL
    `);

    for (const { school_class_id } of classIds) {
      const students: Array<{ id: string }> = await queryRunner.query(
        `SELECT id FROM students WHERE school_class_id = $1 ORDER BY last_name ASC, first_name ASC`,
        [school_class_id],
      );
      for (let i = 0; i < students.length; i++) {
        await queryRunner.query(`UPDATE students SET roll_number = $1 WHERE id = $2`, [
          i + 1,
          students[i].id,
        ]);
      }
    }

    // Partial index: only applies where a class is actually assigned — a
    // student with no class yet has no roll number and shouldn't be
    // constrained by this.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_students_class_roll_number"
      ON "students" ("tenant_id", "school_class_id", "roll_number")
      WHERE "school_class_id" IS NOT NULL AND "roll_number" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_students_class_roll_number"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "roll_number"`);
  }
}
