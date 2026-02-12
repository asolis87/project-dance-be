import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('instructor')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text')
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('phone', 'text')
    .addColumn('specialization', 'text')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_instructor_organization')
    .on('instructor')
    .column('organization_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('instructor').execute();
}
