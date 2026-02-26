import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await db
        .insertInto('saas_plans')
        .values([
            {
                name: 'Gratis',
                description: 'Plan ideal para academias pequeñas que están empezando.',
                price: 0,
                currency: 'USD',
                interval: 'month',
                features: JSON.stringify({
                    students: 10,
                    instructors: 1,
                    groups: 2,
                }),
                is_active: true,
            },
            {
                name: 'Básico',
                description: 'Para academias en crecimiento.',
                price: 29,
                currency: 'USD',
                interval: 'month',
                features: JSON.stringify({
                    students: 100,
                    instructors: 5,
                    groups: 10,
                }),
                // stripe_price_id se configura con: npx tsx scripts/stripe-setup.ts
                is_active: true,
            },
            {
                name: 'Pro',
                description: 'Sin límites para academias consolidadas.',
                price: 99,
                currency: 'USD',
                interval: 'month',
                features: JSON.stringify({
                    students: -1, // Unlimited
                    instructors: -1,
                    groups: -1,
                }),
                // stripe_price_id se configura con: npx tsx scripts/stripe-setup.ts
                is_active: true,
            },
        ])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.deleteFrom('saas_plans').execute();
}
