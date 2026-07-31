import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunicationTables1720900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "circulars_priority_enum" AS ENUM ('normal', 'urgent')
    `);
    await queryRunner.query(`
      CREATE TYPE "circulars_audience_scope_enum" AS ENUM ('whole_school', 'grade', 'class')
    `);
    await queryRunner.query(`
      CREATE TABLE "circulars" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "body" text NOT NULL,
        "priority" "circulars_priority_enum" NOT NULL DEFAULT 'normal',
        "audience_scope" "circulars_audience_scope_enum" NOT NULL,
        "audience_grade_level" character varying(40),
        "audience_school_class_id" uuid,
        "published_by" uuid NOT NULL,
        "published_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_circulars" PRIMARY KEY ("id"),
        CONSTRAINT "FK_circulars_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_circulars_class" FOREIGN KEY ("audience_school_class_id") REFERENCES "school_classes"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_circulars_published_by" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`ALTER TABLE "circulars" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_circulars ON "circulars"
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
    `);

    await queryRunner.query(`
      CREATE TABLE "circular_read_receipts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "circular_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "read_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_circular_read_receipts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_circular_read_receipts_circular" FOREIGN KEY ("circular_id") REFERENCES "circulars"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_circular_read_receipts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_circular_read_receipts_circular_user"
      ON "circular_read_receipts" ("circular_id", "user_id")
    `);
    // No tenant_id column on this table (always reached via its parent
    // circular, which is itself RLS-protected) — same pattern as
    // fee_components/fee_installments.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "circular_read_receipts"`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_circulars ON "circulars";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "circulars"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "circulars_audience_scope_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "circulars_priority_enum"`);
  }
}
