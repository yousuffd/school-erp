import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Library Management core (Blueprint Part 2, Module 12): catalog (Book),
 * physical/barcoded copies (BookCopy), issue/return + fines (BookIssue),
 * and title-level reservations (BookReservation).
 *
 * Follows the examinations/lms convention: no Row-Level Security (RLS is
 * opt-in, currently only on 5 tables per project convention — see
 * circulars for an example of where it IS used); tenant isolation here is
 * enforced in service code via scopedRepo(), same as Exam/Assignment.
 *
 * Digital library / e-book access is out of scope this pass (needs file
 * storage/S3, a separate concern) — see book.entity.ts for the full note.
 */
export class CreateLibraryTables1724400000000 implements MigrationInterface {
  name = 'CreateLibraryTables1724400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "book_copies_status_enum" AS ENUM ('available', 'issued', 'reserved', 'lost', 'under_repair')
    `);
    await queryRunner.query(`
      CREATE TYPE "book_reservations_status_enum" AS ENUM ('pending', 'fulfilled', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "books" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "title" character varying(300) NOT NULL,
        "author" character varying(200) NOT NULL,
        "isbn" character varying(20),
        "category" character varying(100),
        "publisher" character varying(150),
        "edition" character varying(50),
        "cover_url" character varying,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_books" PRIMARY KEY ("id"),
        CONSTRAINT "FK_books_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_books_tenant" ON "books" ("tenant_id")`);

    await queryRunner.query(`
      CREATE TABLE "book_copies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "book_id" uuid NOT NULL,
        "campus_id" uuid NOT NULL,
        "barcode" character varying(50) NOT NULL,
        "status" "book_copies_status_enum" NOT NULL DEFAULT 'available',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_book_copies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_book_copies_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_book_copies_book" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_book_copies_tenant_barcode" ON "book_copies" ("tenant_id", "barcode")
    `);
    await queryRunner.query(`CREATE INDEX "IDX_book_copies_tenant_book" ON "book_copies" ("tenant_id", "book_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_book_copies_tenant_status" ON "book_copies" ("tenant_id", "status")`);

    await queryRunner.query(`
      CREATE TABLE "book_issues" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "book_copy_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "issued_by" uuid NOT NULL,
        "issue_date" date NOT NULL,
        "due_date" date NOT NULL,
        "return_date" date,
        "returned_by" uuid,
        "fine_amount" numeric(6,2),
        "fine_paid" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_book_issues" PRIMARY KEY ("id"),
        CONSTRAINT "FK_book_issues_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_book_issues_book_copy" FOREIGN KEY ("book_copy_id") REFERENCES "book_copies"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_book_issues_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_book_issues_issued_by" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_book_issues_returned_by" FOREIGN KEY ("returned_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_book_issues_tenant_copy_return" ON "book_issues" ("tenant_id", "book_copy_id", "return_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_book_issues_tenant_student" ON "book_issues" ("tenant_id", "student_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "book_reservations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "book_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "status" "book_reservations_status_enum" NOT NULL DEFAULT 'pending',
        "fulfilled_book_copy_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_book_reservations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_book_reservations_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_book_reservations_book" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_book_reservations_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_book_reservations_fulfilled_copy" FOREIGN KEY ("fulfilled_book_copy_id") REFERENCES "book_copies"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_book_reservations_tenant_student" ON "book_reservations" ("tenant_id", "student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_book_reservations_tenant_book_status" ON "book_reservations" ("tenant_id", "book_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "book_reservations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "book_issues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "book_copies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "books"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "book_reservations_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "book_copies_status_enum"`);
  }
}
