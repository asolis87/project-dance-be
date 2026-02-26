import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create saas_plans table
  await db.schema
    .createTable('saas_plans')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('price', 'numeric(10, 2)', (col) => col.notNull())
    .addColumn('currency', 'text', (col) => col.defaultTo('USD').notNull())
    .addColumn('interval', 'text', (col) => col.notNull()) // 'month' | 'year'
    .addColumn('features', 'jsonb', (col) => col.defaultTo('{}'))
    .addColumn('stripe_price_id', 'text')
    .addColumn('is_active', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create saas_subscriptions table
  await db.schema
    .createTable('saas_subscriptions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'text', (col) => col.notNull()) // Linked to Better Auth organization
    .addColumn('plan_id', 'uuid', (col) =>
      col.references('saas_plans.id').onDelete('restrict').notNull(),
    )
    .addColumn('status', 'text', (col) => col.notNull()) // 'active', 'canceled', etc.
    .addColumn('stripe_subscription_id', 'text')
    .addColumn('current_period_start', 'timestamp')
    .addColumn('current_period_end', 'timestamp')
    .addColumn('cancel_at_period_end', 'boolean', (col) =>
      col.defaultTo(false).notNull(),
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Indexes
  await db.schema
    .createIndex('idx_saas_subscriptions_org_id')
    .on('saas_subscriptions')
    .column('organization_id')
    .execute();

  await db.schema
    .createIndex('idx_saas_subscriptions_status')
    .on('saas_subscriptions')
    .column('status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('saas_subscriptions').execute();
  await db.schema.dropTable('saas_plans').execute();
}
