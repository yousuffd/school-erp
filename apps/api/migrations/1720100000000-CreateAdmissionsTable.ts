import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmissionsTable1720100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "admissions_source_enum" AS ENUM ('walk_in', 'referral', 'website', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE "admissions_stage_enum" AS ENUM
        ('inquiry', 'application_submitted', 'under_review', 'waitlisted', 'approved', 'rejected', 'enrolled', 'withdrawn')
    `);
    await queryRunner.query(`
      CREATE TABLE "admissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "applicant_first_name" character varying(100) NOT NULL,
        "applicant_last_name" character varying(100) NOT NULL,
        "date_of_birth" date NOT NULL,
        "desired_grade_level" character varying(40) NOT NULL,
        "guardian_name" character varying(150) NOT NULL,
        "guardian_phone" character varying(32) NOT NULL,
        "guardian_email" character varying(254),
        "source" "admissions_source_enum" NOT NULL DEFAULT 'other',
        "stage" "admissions_stage_enum" NOT NULL DEFAULT 'inquiry',
        "notes" text,
        "enrolled_student_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admissions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_admissions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_admissions_campus" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_admissions_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_admissions_enrolled_student" FOREIGN KEY ("enrolled_student_id") REFERENCES "students"("id") ON DELETE SET NULL
      )
    `);

    // RLS, consistent with every other tenant-scoped table.
    await queryRunner.query(`ALTER TABLE "admissions" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_admissions ON "admissions"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_admissions ON "admissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admissions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admissions_stage_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admissions_source_enum"`);
  }
}
