import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHrPolicyDocuments1727000000000 implements MigrationInterface {
  name = 'CreateHrPolicyDocuments1727000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`ALTER TABLE "hr_policy_documents" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_hr_policy_documents" ON "hr_policy_documents"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);

    await queryRunner.query(`
      CREATE TABLE "hr_document_acknowledgments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "document_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "acknowledged_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hr_document_acknowledgments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_hr_document_acknowledgments_tenant_document_employee" UNIQUE ("tenant_id", "document_id", "employee_id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "hr_document_acknowledgments" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation_hr_document_acknowledgments" ON "hr_document_acknowledgments"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hr_document_acknowledgments"`);
    await queryRunner.query(`DROP TABLE "hr_policy_documents"`);
  }
}
