import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentTransportOptOuts1785192690182 implements MigrationInterface {
    name = 'AddStudentTransportOptOuts1785192690182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "student_transport_opt_outs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "student_id" uuid NOT NULL, "academic_year_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1609778d32e71bb84f1be0e5a35" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c50176b71d3525756d460bff14" ON "student_transport_opt_outs" ("tenant_id", "student_id", "academic_year_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c50176b71d3525756d460bff14"`);
        await queryRunner.query(`DROP TABLE "student_transport_opt_outs"`);
    }
}
