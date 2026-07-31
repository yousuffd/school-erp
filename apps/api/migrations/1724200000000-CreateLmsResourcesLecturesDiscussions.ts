import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remaining LMS core (Blueprint Part 2, Module 6): Notes/Resource Repository,
 * Lecture Video Library + basic watched-tracking, Discussion Forums.
 * All reuse the 'lms' permission module already granted in
 * BackfillLmsRolePermissions — no new backfill migration needed.
 */
export class CreateLmsResourcesLecturesDiscussions1724200000000 implements MigrationInterface {
  name = 'CreateLmsResourcesLecturesDiscussions1724200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "learning_resources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "title" varchar(150) NOT NULL,
        "description" text NULL,
        "file_path" varchar(500) NOT NULL,
        "original_filename" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "file_size" integer NOT NULL,
        "uploaded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_learning_resources" PRIMARY KEY ("id")
      );
      CREATE INDEX "IDX_learning_resources_tenant_class" ON "learning_resources" ("tenant_id", "school_class_id");

      CREATE TABLE "lectures" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "title" varchar(150) NOT NULL,
        "description" text NULL,
        "video_path" varchar(500) NOT NULL,
        "original_filename" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "file_size" integer NOT NULL,
        "uploaded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lectures" PRIMARY KEY ("id")
      );
      CREATE INDEX "IDX_lectures_tenant_class" ON "lectures" ("tenant_id", "school_class_id");

      CREATE TABLE "lecture_progress" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "lecture_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "watched_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lecture_progress" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lecture_progress_lecture" FOREIGN KEY ("lecture_id")
          REFERENCES "lectures"("id") ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX "UQ_lecture_progress_lecture_student" ON "lecture_progress" ("tenant_id", "lecture_id", "student_id");

      CREATE TABLE "discussion_threads" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "school_class_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "title" varchar(150) NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_discussion_threads" PRIMARY KEY ("id")
      );
      CREATE INDEX "IDX_discussion_threads_tenant_class" ON "discussion_threads" ("tenant_id", "school_class_id");

      CREATE TABLE "discussion_posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "thread_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_discussion_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_discussion_posts_thread" FOREIGN KEY ("thread_id")
          REFERENCES "discussion_threads"("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_discussion_posts_thread" ON "discussion_posts" ("thread_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "discussion_posts";
      DROP TABLE IF EXISTS "discussion_threads";
      DROP TABLE IF EXISTS "lecture_progress";
      DROP TABLE IF EXISTS "lectures";
      DROP TABLE IF EXISTS "learning_resources";
    `);
  }
}
