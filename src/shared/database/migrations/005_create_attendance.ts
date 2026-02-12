import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Crear tipo ENUM para el tipo de asistencia
  await sql`CREATE TYPE attendance_type AS ENUM ('qr', 'number', 'manual')`.execute(db);

  await db.schema
    .createTable('attendance')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('student_id', 'uuid', (col) =>
      col.notNull().references('student.id'),
    )
    .addColumn('group_id', 'uuid', (col) =>
      col.notNull().references('dance_group.id'),
    )
    .addColumn('date', 'date', (col) =>
      col.notNull().defaultTo(sql`CURRENT_DATE`),
    )
    .addColumn('type', sql`attendance_type`, (col) => col.notNull())
    .addColumn('registered_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_attendance_student')
    .on('attendance')
    .column('student_id')
    .execute();

  await db.schema
    .createIndex('idx_attendance_group')
    .on('attendance')
    .column('group_id')
    .execute();

  await db.schema
    .createIndex('idx_attendance_date')
    .on('attendance')
    .column('date')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('attendance').execute();
  await sql`DROP TYPE IF EXISTS attendance_type`.execute(db);
}
