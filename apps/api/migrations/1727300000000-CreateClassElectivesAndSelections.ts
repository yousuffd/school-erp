import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Two new tables for the elective-subject feature (session 27):
 *
 * class_elective_offerings — which elective subjects a SPECIFIC class
 * makes available (e.g. Grade 5-A offers French+Spanish, Grade 6-A offers
 * French+Hindi) — a class only offers a subset of the tenant's full
 * elective catalog, not everything marked is_elective tenant-wide.
 *
 * student_elective_selections — a student's chosen elective, scoped per
 * academic year (a per-year choice, not a permanent attribute). Uniqueness
 * is enforced at (tenant, student, subject, year) only — the real business
 * rule ("only one selection per elective_group per year") can't be
 * expressed as a DB constraint since elective_group lives on Subject, not
 * this table, so it's checked in StudentElectiveSelectionsService instead,
 * same "checked in the service" pattern used throughout this session.
 * Locked-in-once-selected is also an application-level rule (self-service
 * route rejects a second selection in the same group/year), not a DB
 * constraint — an Admin-only route can still override it.
 */
export class CreateClassElectivesAndSelections1727300000000 implements MigrationInterface {
  name = 'CreateClassElectivesAndSelections1727300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "class_elective_offerings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_class_elective_offerings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_class_elective_offerings_tenant_class_subject" UNIQUE ("tenant_id", "school_class_id", "subject_id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "class_elective_offerings" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_class_elective_offerings" ON "class_elective_offerings"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);

    await queryRunner.query(`
      CREATE TABLE "student_elective_selections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_elective_selections" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_elective_selections_tenant_student_subject_year" UNIQUE ("tenant_id", "student_id", "subject_id", "academic_year_id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "student_elective_selections" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_student_elective_selections" ON "student_elective_selections"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "student_elective_selections"`);
    await queryRunner.query(`DROP TABLE "class_elective_offerings"`);
  }
}