import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('audit_log')
    .addColumn('id', 'uuid', (col) => col.defaultTo('gen_random_uuid()').primaryKey())
    .addColumn('action', 'varchar(100)', (col) => col.notNull())
    .addColumn('resource', 'varchar(100)', (col) => col.notNull())
    .addColumn('resource_id', 'uuid', (col) => col)
    .addColumn('organization_id', 'uuid', (col) => col)
    .addColumn('user_id', 'uuid', (col) => col)
    .addColumn('request_id', 'varchar(36)', (col) => col)
    .addColumn('metadata', 'jsonb', (col) => col.defaultTo('{}'))
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo('now()').notNull())
    .execute();

  await db.schema
    .createIndex('idx_audit_log_organization_id')
    .on('audit_log')
    .column('organization_id')
    .execute();

  await db.schema
    .createIndex('idx_audit_log_created_at')
    .on('audit_log')
    .column('created_at')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('audit_log').execute();
}
