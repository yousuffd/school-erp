import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Copies existing hr_policy_documents + hr_document_acknowledgments data
 * into the new documents/document_acknowledgments tables. Deliberately
 * does NOT drop the old tables in this migration — that's a separate,
 * explicit step (DropHrPolicyDocumentsTables) run only after the copy is
 * manually verified. employee_id on hr_document_acknowledgments is
 * REMAPPED to the linked user_id via a join against employees.user_id;
 * any acknowledgment row whose employee has no linked user_id is skipped
 * and logged (not silently dropped) since there's no user_id to map it to.
 */
export class MigrateHrPolicyDocumentsData1728200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO documents (
        id, tenant_id, category, title, description, file_path, original_filename,
        mime_type, file_size, version, approval_status, uploaded_by, created_at, updated_at
      )
      SELECT
        id, tenant_id, 'hr_policy', title, description, file_path, original_filename,
        mime_type, file_size, 1, 'approved', uploaded_by, created_at, created_at
      FROM hr_policy_documents
    `);

    const skipped: Array<{ id: string; employee_id: string }> = await queryRunner.query(`
      SELECT a.id, a.employee_id
      FROM hr_document_acknowledgments a
      LEFT JOIN employees e ON e.id = a.employee_id
      WHERE e.user_id IS NULL
    `);
    if (skipped.length > 0) {
      console.warn(
        `MigrateHrPolicyDocumentsData: skipping ${skipped.length} acknowledgment row(s) with no linked user_id:`,
        skipped.map((s) => s.id).join(', '),
      );
    }

    await queryRunner.query(`
      INSERT INTO document_acknowledgments (id, tenant_id, document_id, acknowledged_by, acknowledged_at)
      SELECT a.id, a.tenant_id, a.document_id, e.user_id, a.acknowledged_at
      FROM hr_document_acknowledgments a
      JOIN employees e ON e.id = a.employee_id
      WHERE e.user_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM document_acknowledgments
      WHERE id IN (SELECT id FROM hr_document_acknowledgments)
    `);
    await queryRunner.query(`
      DELETE FROM documents
      WHERE id IN (SELECT id FROM hr_policy_documents)
    `);
  }
}
