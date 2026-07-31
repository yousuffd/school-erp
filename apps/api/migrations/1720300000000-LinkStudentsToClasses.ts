import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds Student.school_class_id and backfills it for existing students by
 * matching their current grade_level/section strings to a SchoolClass —
 * creating one if no matching class exists yet. This is the retrofit flagged
 * as a follow-up when SchoolClass was first built (see classes/entities/
 * school-class.entity.ts); it's happening now because Attendance genuinely
 * needs a real class roster, and string-matching alone isn't reliable enough
 * to build one from.
 *
 * grade_level/section strings on Student are left in place (not removed) —
 * this is additive, not a breaking rename.
 */
export class LinkStudentsToClasses1720300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students" ADD COLUMN "school_class_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "students" ADD CONSTRAINT "FK_students_school_class"
      FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE SET NULL
    `);

    // Distinct (tenant, campus, year, grade, section) combos currently in use.
    const combos: Array<{
      tenant_id: string;
      campus_id: string;
      academic_year_id: string;
      grade_level: string;
      section: string | null;
    }> = await queryRunner.query(`
      SELECT DISTINCT tenant_id, campus_id, academic_year_id, grade_level, section
      FROM students
    `);

    for (const combo of combos) {
      // Find an existing class matching this combo (section comparison must
      // handle NULL correctly — regular = fails to match NULL to NULL).
      const existing: Array<{ id: string }> = await queryRunner.query(
        `
          SELECT id FROM school_classes
          WHERE tenant_id = $1 AND academic_year_id = $2 AND grade_level = $3
            AND section IS NOT DISTINCT FROM $4
          LIMIT 1
        `,
        [combo.tenant_id, combo.academic_year_id, combo.grade_level, combo.section],
      );

      let classId: string;
      if (existing.length > 0) {
        classId = existing[0].id;
      } else {
        const inserted: Array<{ id: string }> = await queryRunner.query(
          `
            INSERT INTO school_classes (tenant_id, campus_id, academic_year_id, grade_level, section)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `,
          [combo.tenant_id, combo.campus_id, combo.academic_year_id, combo.grade_level, combo.section],
        );
        classId = inserted[0].id;
      }

      await queryRunner.query(
        `
          UPDATE students
          SET school_class_id = $1
          WHERE tenant_id = $2 AND academic_year_id = $3 AND grade_level = $4
            AND section IS NOT DISTINCT FROM $5
        `,
        [classId, combo.tenant_id, combo.academic_year_id, combo.grade_level, combo.section],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_school_class"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "school_class_id"`);
    // Note: does NOT delete the school_classes rows this migration created —
    // those may have been used/edited independently by the time of rollback.
  }
}
