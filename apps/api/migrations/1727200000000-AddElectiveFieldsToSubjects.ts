import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds elective-tagging fields to the existing subjects catalog.
 * is_elective defaults false (every existing subject stays core/required,
 * no behavior change for anything already built). elective_group is
 * nullable and only meaningful when is_elective=true — groups mutually
 * exclusive alternatives (e.g. French/Spanish/Hindi all in "Language") so
 * a student can only pick one per group, without hardcoding "Language" as
 * a special case; a future "Arts" or "Sport" elective group works
 * identically with no schema change.
 */
export class AddElectiveFieldsToSubjects1727200000000 implements MigrationInterface {
  name = 'AddElectiveFieldsToSubjects1727200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subjects"
      ADD COLUMN "is_elective" boolean NOT NULL DEFAULT false,
      ADD COLUMN "elective_group" character varying(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subjects"
      DROP COLUMN "is_elective",
      DROP COLUMN "elective_group"
    `);
  }
}