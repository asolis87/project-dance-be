import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('dance_group')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'text', (col) => col.notNull())
    .addColumn('instructor_id', 'uuid', (col) =>
      col.notNull().references('instructor.id'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('schedule', 'text')
    .addColumn('capacity', 'integer', (col) => col.notNull())
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_dance_group_organization')
    .on('dance_group')
    .column('organization_id')
    .execute();

  await db.schema
    .createIndex('idx_dance_group_instructor')
    .on('dance_group')
    .column('instructor_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('dance_group').execute();
}
