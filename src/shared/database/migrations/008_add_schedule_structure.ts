import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Agregar campos estructurados de horario (text[] y time no tienen equivalente directo en schema builder)
  await sql`
    ALTER TABLE dance_group
      ADD COLUMN schedule_days text[],
      ADD COLUMN start_time time,
      ADD COLUMN end_time time
  `.execute(db);

  // Eliminar columna schedule antigua (texto libre)
  await db.schema
    .alterTable('dance_group')
    .dropColumn('schedule')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Restaurar columna schedule original
  await db.schema
    .alterTable('dance_group')
    .addColumn('schedule', 'text')
    .execute();

  // Eliminar columnas estructuradas
  await sql`
    ALTER TABLE dance_group
      DROP COLUMN IF EXISTS schedule_days,
      DROP COLUMN IF EXISTS start_time,
      DROP COLUMN IF EXISTS end_time
  `.execute(db);
}
