import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets a grade have two companion fee structures — "with transport" and
 * "without transport" — that the parent self-service toggle can reliably
 * find by (tenant, academic_year, grade_level, transport_included) rather
 * than parsing structure names as strings. Defaults existing rows to true
 * since every fee structure created before this migration includes
 * transport in its components.
 */
export class AddTransportIncludedToFeeStructures1784700000000 implements MigrationInterface {
  name = 'AddTransportIncludedToFeeStructures1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fee_structures"
      ADD COLUMN "transport_included" boolean NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fee_structures" DROP COLUMN IF EXISTS "transport_included";`);
  }
}
