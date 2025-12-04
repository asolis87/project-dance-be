import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('refresh_token')
    .addColumn('id', 'text', (col) => col.primaryKey()) // El token mismo será el ID
    .addColumn('user_id', 'text', (col) => col.notNull().references('auth.id').onDelete('cascade'))
    .addColumn('valid', 'integer', (col) => col.defaultTo(1).notNull()) // 1 = true
    .addColumn('expires_at', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => 
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('refresh_token').execute();
}