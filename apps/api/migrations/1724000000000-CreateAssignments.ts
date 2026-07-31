import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * LMS Assignments (Blueprint Part 2, Module 6). First LMS deliverable —
 * full create -> submit -> grade workflow, file-upload submissions only
 * (no text-entry option, per decision), local disk storage for now.
 */
export class CreateAssignments1724000000000 implements MigrationInterface {
  name = 'CreateAssignments1724000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "title" varchar(150) NOT NULL,
        "instructions" text NULL,
        "due_date" timestamp NOT NULL,
        "max_score" numeric(6,2) NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assignments" PRIMARY KEY ("id")
      );

      CREATE INDEX "IDX_assignments_tenant_class" ON "assignments" ("tenant_id", "school_class_id");

      CREATE TABLE "assignment_submissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "assignment_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "file_path" varchar(500) NOT NULL,
        "original_filename" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "file_size" integer NOT NULL,
        "submitted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_late" boolean NOT NULL DEFAULT false,
        "score" numeric(6,2) NULL,
        "feedback" text NULL,
        "graded_by" uuid NULL,
        "graded_at" TIMESTAMP NULL,
        "uploaded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assignment_submissions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_submissions_assignment" FOREIGN KEY ("assignment_id")
          REFERENCES "assignments"("id") ON DELETE CASCADE
      );

      -- One submission per student per assignment — resubmission UPDATES this
      -- row (replacing the file) rather than inserting a new one.
      CREATE UNIQUE INDEX "UQ_submissions_assignment_student" ON "assignment_submissions" ("tenant_id", "assignment_id", "student_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "assignment_submissions";
      DROP INDEX IF EXISTS "IDX_assignments_tenant_class";
      DROP TABLE IF EXISTS "assignments";
    `);
  }
}
