import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicManagementTables1720200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- subjects ---
    await queryRunner.query(`
      CREATE TABLE "subjects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "code" character varying(20) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subjects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subjects_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_subjects_tenant_code" ON "subjects" ("tenant_id", "code")
    `);
    await queryRunner.query(`ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_subjects ON "subjects"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);

    // --- school_classes ---
    await queryRunner.query(`
      CREATE TABLE "school_classes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "grade_level" character varying(40) NOT NULL,
        "section" character varying(20),
        "class_teacher_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_school_classes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_school_classes_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_school_classes_campus" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_school_classes_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_school_classes_teacher" FOREIGN KEY ("class_teacher_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_school_classes_tenant_year_grade_section"
      ON "school_classes" ("tenant_id", "academic_year_id", "grade_level", "section")
    `);
    await queryRunner.query(`ALTER TABLE "school_classes" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_school_classes ON "school_classes"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);

    // --- timetable_slots ---
    await queryRunner.query(`
      CREATE TYPE "timetable_slots_day_of_week_enum" AS ENUM
        ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
    `);
    await queryRunner.query(`
      CREATE TABLE "timetable_slots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "teacher_id" uuid NOT NULL,
        "day_of_week" "timetable_slots_day_of_week_enum" NOT NULL,
        "period_number" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_timetable_slots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_timetable_slots_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_timetable_slots_class" FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_timetable_slots_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_timetable_slots_teacher" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_timetable_slots_class_day_period"
      ON "timetable_slots" ("tenant_id", "school_class_id", "day_of_week", "period_number")
    `);
    await queryRunner.query(`ALTER TABLE "timetable_slots" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_timetable_slots ON "timetable_slots"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_timetable_slots ON "timetable_slots";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "timetable_slots"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "timetable_slots_day_of_week_enum"`);

    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_school_classes ON "school_classes";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "school_classes"`);

    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_subjects ON "subjects";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subjects"`);
  }
}
