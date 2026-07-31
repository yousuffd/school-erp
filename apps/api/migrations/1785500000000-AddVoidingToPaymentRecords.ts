import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Payments are soft-deleted only (decided this session) — never hard-edited
 * or hard-deleted, to preserve the audit trail. voided_at/voided_by mark a
 * payment as no longer valid without removing the original row.
 */
export class AddVoidingToPaymentRecords1785500000000 implements MigrationInterface {
  name = 'AddVoidingToPaymentRecords1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_records" ADD COLUMN "voided_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "payment_records" ADD COLUMN "voided_by" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_records" DROP COLUMN "voided_by"`);
    await queryRunner.query(`ALTER TABLE "payment_records" DROP COLUMN "voided_at"`);
  }
}
