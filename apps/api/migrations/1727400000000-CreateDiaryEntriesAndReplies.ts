import { MigrationInterface, QueryRunner } from 'typeorm';

// Next in the 100,000,000-increment sequence after
// 1727300000000-CreateClassElectivesAndSelections.ts
// Verify this timestamp doesn't collide with anything landed since the handover.

export class CreateDiaryEntriesAndReplies1727400000000 implements MigrationInterface {
  name = 'CreateDiaryEntriesAndReplies1727400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "diary_entry_scope_enum" AS ENUM ('class', 'student');
    `);

    await queryRunner.query(`
      CREATE TYPE "diary_entry_category_enum" AS ENUM ('Homework', 'Remark', 'Notice', 'General');
    `);

    await queryRunner.query(`
      CREATE TABLE "diary_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        "scope" "diary_entry_scope_enum" NOT NULL,
        "student_id" uuid,
        "author_id" uuid NOT NULL,
        "category" "diary_entry_category_enum" NOT NULL DEFAULT 'General',
        "content" text NOT NULL,
        "entry_date" date NOT NULL DEFAULT CURRENT_DATE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_diary_entries" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_diary_entry_student_scope" CHECK (
          (scope = 'student' AND student_id IS NOT NULL) OR
          (scope = 'class' AND student_id IS NULL)
        )
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_diary_entries_tenant" ON "diary_entries" ("tenant_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_diary_entries_class" ON "diary_entries" ("class_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_diary_entries_student" ON "diary_entries" ("student_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "diary_replies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "diary_entry_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_diary_replies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_diary_replies_entry" FOREIGN KEY ("diary_entry_id")
          REFERENCES "diary_entries" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_diary_replies_entry" ON "diary_replies" ("diary_entry_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_diary_replies_tenant" ON "diary_replies" ("tenant_id");
    `);

    // RLS — mirror whatever policy shape your other tenant-scoped tables use
    // with the school_erp_app restricted role. Confirm exact policy syntax
    // against an existing migration (e.g. the elective tables' migration)
    // rather than assuming this is correct as-is.
    await queryRunner.query(`ALTER TABLE "diary_entries" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_diary_entries" ON "diary_entries"
        USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
    `);
    await queryRunner.query(`ALTER TABLE "diary_replies" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_diary_replies" ON "diary_replies"
        USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
    `);

    // No feature-catalog row needed — per TenantFeatureToggle's design,
    // absence of a row for a (tenant_id, feature_key) means enabled=true
    // by default. The 'diary' feature key is live as soon as
    // @RequiresFeature('diary') is deployed; a tenant only gets a row here
    // if/when an admin explicitly disables it via the toggles UI.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "diary_replies";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "diary_entries";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "diary_entry_category_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "diary_entry_scope_enum";`);
  }
}