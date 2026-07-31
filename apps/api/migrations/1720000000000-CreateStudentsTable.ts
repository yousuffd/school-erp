import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentsTable1720000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "students_gender_enum" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say')
    `);
    await queryRunner.query(`
      CREATE TYPE "students_status_enum" AS ENUM
        ('enrolled', 'active', 'transferred', 'withdrawn', 'graduated', 'alumni')
    `);
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "admission_number" character varying(40) NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "date_of_birth" date NOT NULL,
        "gender" "students_gender_enum" NOT NULL DEFAULT 'prefer_not_to_say',
        "grade_level" character varying(40) NOT NULL,
        "section" character varying(20),
        "academic_year_id" uuid NOT NULL,
        "status" "students_status_enum" NOT NULL DEFAULT 'enrolled',
        "enrollment_date" date NOT NULL,
        "guardian_name" character varying(150) NOT NULL,
        "guardian_phone" character varying(32) NOT NULL,
        "guardian_email" character varying(254),
        "emergency_contact_name" character varying(150),
        "emergency_contact_phone" character varying(32),
        "medical_notes" text,
        "photo_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_students" PRIMARY KEY ("id"),
        CONSTRAINT "FK_students_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_students_campus" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_students_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_students_tenant_admission_number" ON "students" ("tenant_id", "admission_number")
    `);

    // RLS, consistent with every other tenant-scoped table (see EnableRls migration).
    await queryRunner.query(`ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_students ON "students"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_students ON "students";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "students_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "students_gender_enum"`);
  }
}
