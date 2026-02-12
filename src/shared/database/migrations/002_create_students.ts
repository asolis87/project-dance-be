import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Crear secuencia para números de afiliación auto-incrementales
  await sql`CREATE SEQUENCE IF NOT EXISTS student_affiliation_seq START 1`.execute(db);

  await db.schema
    .createTable('student')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('phone', 'text')
    .addColumn('affiliation_number', 'text', (col) =>
      col.notNull().unique().defaultTo(sql`'AF-' || lpad(nextval('student_affiliation_seq')::text, 6, '0')`),
    )
    .addColumn('qr_code', 'text')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_student_organization')
    .on('student')
    .column('organization_id')
    .execute();

  await db.schema
    .createIndex('idx_student_affiliation')
    .on('student')
    .column('affiliation_number')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('student').execute();
  await sql`DROP SEQUENCE IF EXISTS student_affiliation_seq`.execute(db);
}
