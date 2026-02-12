import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Crear tipo ENUM para el tipo de pago
  await sql`CREATE TYPE payment_type AS ENUM ('full', 'partial')`.execute(db);

  await db.schema
    .createTable('payment')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('membership_id', 'uuid', (col) =>
      col.notNull().references('membership.id'),
    )
    .addColumn('student_id', 'uuid', (col) =>
      col.notNull().references('student.id'),
    )
    .addColumn('organization_id', 'text', (col) => col.notNull())
    .addColumn('amount', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('paid_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('type', sql`payment_type`, (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable('payment_reminder')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('membership_id', 'uuid', (col) =>
      col.notNull().references('membership.id'),
    )
    .addColumn('reminder_type', 'text', (col) => col.notNull())
    .addColumn('sent_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_payment_membership')
    .on('payment')
    .column('membership_id')
    .execute();

  await db.schema
    .createIndex('idx_payment_organization')
    .on('payment')
    .column('organization_id')
    .execute();

  await db.schema
    .createIndex('idx_payment_student')
    .on('payment')
    .column('student_id')
    .execute();

  await db.schema
    .createIndex('idx_payment_reminder_membership')
    .on('payment_reminder')
    .column('membership_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('payment_reminder').execute();
  await db.schema.dropTable('payment').execute();
  await sql`DROP TYPE IF EXISTS payment_type`.execute(db);
}
