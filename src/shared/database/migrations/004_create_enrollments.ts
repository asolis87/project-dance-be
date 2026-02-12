import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('enrollment')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('group_id', 'uuid', (col) =>
      col.notNull().references('dance_group.id'),
    )
    .addColumn('student_id', 'uuid', (col) =>
      col.notNull().references('student.id'),
    )
    .addColumn('enrolled_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('unenrolled_at', 'timestamptz')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .execute();

  // Un alumno solo puede estar inscrito una vez activo en un grupo (partial unique index)
  await sql`
    CREATE UNIQUE INDEX idx_enrollment_unique_active
    ON enrollment (group_id, student_id)
    WHERE is_active = true
  `.execute(db);

  await db.schema
    .createIndex('idx_enrollment_group')
    .on('enrollment')
    .column('group_id')
    .execute();

  await db.schema
    .createIndex('idx_enrollment_student')
    .on('enrollment')
    .column('student_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('enrollment').execute();
}
