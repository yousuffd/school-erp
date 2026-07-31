import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inventory & Asset Management core (Blueprint Part 2, Module 15): item
 * catalog, per-campus bulk stock + transaction audit trail, individually
 * tracked asset tags, and procurement request workflow.
 *
 * Follows the established convention: no Row-Level Security (still only
 * actually on 5 tables project-wide); tenant isolation enforced in
 * service code via scopedRepo(). No FK on campus_id (matches
 * Student/BookCopy precedent — plain uuid, no enforced referential
 * constraint since no Campus relation is modeled at the entity level).
 */
export class CreateInventoryAssetsTables1725000000000 implements MigrationInterface {
  name = 'CreateInventoryAssetsTables1725000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "items_category_enum" AS ENUM ('stationery', 'uniform', 'lab_equipment', 'furniture', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE "stock_transactions_transaction_type_enum" AS ENUM ('received', 'issued', 'adjusted')
    `);
    await queryRunner.query(`
      CREATE TYPE "asset_tags_status_enum" AS ENUM ('in_use', 'under_repair', 'retired', 'lost')
    `);
    await queryRunner.query(`
      CREATE TYPE "procurement_requests_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'fulfilled')
    `);

    await queryRunner.query(`
      CREATE TABLE "items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "category" "items_category_enum" NOT NULL,
        "unit" character varying(20) NOT NULL,
        "is_trackable_asset" boolean NOT NULL DEFAULT false,
        "reorder_point" integer,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_items_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_items_tenant" ON "items" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_items_tenant_category" ON "items" ("tenant_id", "category")`);

    await queryRunner.query(`
      CREATE TABLE "item_stocks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "quantity_on_hand" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_item_stocks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_item_stocks_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_item_stocks_item" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_item_stocks_tenant_item_campus" ON "item_stocks" ("tenant_id", "item_id", "campus_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "stock_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "transaction_type" "stock_transactions_transaction_type_enum" NOT NULL,
        "quantity" integer NOT NULL,
        "transaction_date" date NOT NULL,
        "recorded_by" uuid NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_st_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_st_item" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_st_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_st_tenant_item_campus" ON "stock_transactions" ("tenant_id", "item_id", "campus_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "asset_tags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "asset_tag_number" character varying(50) NOT NULL,
        "status" "asset_tags_status_enum" NOT NULL DEFAULT 'in_use',
        "assigned_location" character varying(150),
        "purchase_date" date,
        "purchase_cost" numeric(10,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asset_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_asset_tags_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_asset_tags_item" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_asset_tags_tenant_number" ON "asset_tags" ("tenant_id", "asset_tag_number")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_asset_tags_tenant_item" ON "asset_tags" ("tenant_id", "item_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_asset_tags_tenant_status" ON "asset_tags" ("tenant_id", "status")`);

    await queryRunner.query(`
      CREATE TABLE "procurement_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "requested_by" uuid NOT NULL,
        "quantity_requested" integer NOT NULL,
        "status" "procurement_requests_status_enum" NOT NULL DEFAULT 'pending',
        "requested_date" date NOT NULL,
        "approved_by" uuid,
        "approval_date" date,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_procurement_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pr_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pr_item" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_pr_requested_by" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_pr_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pr_tenant_status" ON "procurement_requests" ("tenant_id", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "procurement_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "item_stocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "items"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "procurement_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "asset_tags_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "stock_transactions_transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "items_category_enum"`);
  }
}
