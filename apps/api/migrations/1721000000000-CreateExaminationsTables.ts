import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExaminationsTables1721000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "exams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "exam_date" date NOT NULL,
        "max_marks" numeric(6,2) NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exams" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exams_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exams_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_exams_class" FOREIGN KEY ("school_class_id") REFERENCES "school_classes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exams_academic_year" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_exams_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`ALTER TABLE "exams" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_exams ON "exams"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);

    await queryRunner.query(`
      CREATE TABLE "exam_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "exam_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "marks_obtained" numeric(6,2),
        "entered_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exam_results_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_results_exam" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_results_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_exam_results_entered_by" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_exam_results_exam_student"
      ON "exam_results" ("tenant_id", "exam_id", "student_id")
    `);
    await queryRunner.query(`ALTER TABLE "exam_results" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_exam_results ON "exam_results"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_exam_results ON "exam_results";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_results"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_exams ON "exams";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exams"`);
  }
}
