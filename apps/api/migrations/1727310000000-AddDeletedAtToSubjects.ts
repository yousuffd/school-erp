import { MigrationInterface, QueryRunner } from 'typeorm';

// Fits between 1727300000000-CreateClassElectivesAndSelections.ts and
// 1727400000000-CreateDiaryEntriesAndReplies.ts in the 100,000,000-increment
// sequence. VERIFY no other migration has landed with a colliding timestamp
// since the last handover before running this.

export class AddDeletedAtToSubjects1727310000000 implements MigrationInterface {
  name = 'AddDeletedAtToSubjects1727310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subjects" ADD COLUMN "deleted_at" TIMESTAMPTZ;
    `);
    // Optional but recommended: partial index so soft-deleted rows don't
    // slow down the common "active subjects" queries (findAllForTenant, etc.)
    await queryRunner.query(`
      CREATE INDEX "IDX_subjects_not_deleted" ON "subjects" ("tenant_id")
      WHERE "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subjects_not_deleted";`);
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "deleted_at";`);
  }
}