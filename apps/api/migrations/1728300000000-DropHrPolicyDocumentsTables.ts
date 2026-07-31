import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the old hr_policy_documents/hr_document_acknowledgments tables,
 * run only after MigrateHrPolicyDocumentsData's copy was manually verified
 * (row counts + content spot-check, both confirmed exact match). The down()
 * migration recreates empty tables only — it cannot restore dropped data,
 * since this is a genuinely destructive step by design, not a mistake.
 */
export class DropHrPolicyDocumentsTables1728300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hr_document_acknowledgments"`);
    await queryRunner.query(`DROP TABLE "hr_policy_documents"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate empty shells only — data is NOT recoverable from this migration alone.
    // Restore from pre_cleanup_backup.dump or a fresh pg_dump if a true rollback is ever needed.
    await queryRunner.query(`
      CREATE TABLE "hr_policy_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "file_path" varchar NOT NULL,
        "original_filename" varchar NOT NULL,
        "mime_type" varchar NOT NULL,
        "file_size" integer NOT NULL,
        "uploaded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hr_policy_documents" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "hr_document_acknowledgments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "document_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "acknowledged_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hr_document_acknowledgments" PRIMARY KEY ("id")
      )
    `);
  }
}
