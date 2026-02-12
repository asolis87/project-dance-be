import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Crear tipo ENUM para el estado de membresía
  await sql`CREATE TYPE membership_status AS ENUM ('active', 'expired', 'cancelled')`.execute(db);

  await db.schema
    .createTable('membership')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('student_id', 'uuid', (col) =>
      col.notNull().references('student.id'),
    )
    .addColumn('organization_id', 'text', (col) => col.notNull())
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('end_date', 'date', (col) => col.notNull())
    .addColumn('amount', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('status', sql`membership_status`, (col) =>
      col.notNull().defaultTo('active'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_membership_student')
    .on('membership')
    .column('student_id')
    .execute();

  await db.schema
    .createIndex('idx_membership_organization')
    .on('membership')
    .column('organization_id')
    .execute();

  await db.schema
    .createIndex('idx_membership_end_date')
    .on('membership')
    .column('end_date')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('membership').execute();
  await sql`DROP TYPE IF EXISTS membership_status`.execute(db);
}
