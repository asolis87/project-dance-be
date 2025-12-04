import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema.createTable('auth')
        .addColumn('id', 'text', (column) => column.primaryKey())
        .addColumn('email', 'text', (column) => column.unique().notNull())
        .addColumn('password_hash', 'text', (column) => column.notNull())
        .addColumn('active', 'boolean', (column) => column.defaultTo(true).notNull())
        .addColumn('created_at', 'text', (column) => column.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
        .addColumn('updated_at', 'text', (column) => column.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
        .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('auth').execute();
}