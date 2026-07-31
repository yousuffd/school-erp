import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentsTables1728100000000 implements MigrationInterface {
  name = 'CreateDocumentsTables1728100000000';

  private readonly tables = ['documents', 'document_acknowledgments', 'certificates'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "documents_category_enum" AS ENUM ('hr_policy', 'student_document', 'staff_document', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "documents_approval_status_enum" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected')`,
    );
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "category" "documents_category_enum" NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "related_student_id" uuid,
        "related_employee_id" uuid,
        "file_path" varchar NOT NULL,
        "original_filename" varchar NOT NULL,
        "mime_type" varchar NOT NULL,
        "file_size" integer NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "supersedes_document_id" uuid,
        "approval_status" "documents_approval_status_enum" NOT NULL DEFAULT 'approved',
        "approved_by" uuid,
        "uploaded_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "document_acknowledgments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "document_id" uuid NOT NULL,
        "acknowledged_by" uuid NOT NULL,
        "acknowledged_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_acknowledgments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_acknowledgments_doc_user" UNIQUE ("tenant_id", "document_id", "acknowledged_by")
      )
    `);

    await queryRunner.query(`CREATE TYPE "certificates_type_enum" AS ENUM ('bonafide', 'transfer', 'character')`);
    await queryRunner.query(`
      CREATE TABLE "certificates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "certificate_type" "certificates_type_enum" NOT NULL,
        "issued_date" date NOT NULL,
        "issued_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_certificates" PRIMARY KEY ("id")
      )
    `);

    for (const table of this.tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`
        CREATE POLICY "tenant_isolation_${table}" ON "${table}"
        USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [...this.tables].reverse()) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
    await queryRunner.query(`DROP TYPE "documents_category_enum"`);
    await queryRunner.query(`DROP TYPE "documents_approval_status_enum"`);
    await queryRunner.query(`DROP TYPE "certificates_type_enum"`);
  }
}
