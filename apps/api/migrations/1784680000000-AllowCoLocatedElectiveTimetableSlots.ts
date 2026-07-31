import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Loosens timetable_slots' uniqueness from (tenant_id, school_class_id,
 * day_of_week, period_number) to also include subject_id — allowing
 * multiple co-located rows at the same class/day/period (e.g. French +
 * Spanish + German all at Grade 6-B/Monday/Period-3, one row per language
 * teacher), needed for the elective model where students split by their
 * own selection rather than a class being locked to one elective subject.
 *
 * Hand-written rather than using the auto-generated migration, which
 * picked up unrelated schema drift across dozens of unrelated tables
 * (foreign key constraint renames, index churn on vehicles/fees/diary/
 * alumni/etc.) — this migration touches ONLY the one index in question.
 */
export class AllowCoLocatedElectiveTimetableSlots1784680000000 implements MigrationInterface {
    name = 'AllowCoLocatedElectiveTimetableSlots1784680000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_timetable_slots_class_day_period"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_timetable_slots_class_day_period_subject" ON "timetable_slots" ("tenant_id", "school_class_id", "day_of_week", "period_number", "subject_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_timetable_slots_class_day_period_subject"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_timetable_slots_class_day_period" ON "timetable_slots" ("tenant_id", "school_class_id", "day_of_week", "period_number")`);
    }
}
