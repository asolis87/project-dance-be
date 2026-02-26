/**
 * Script para crear Products y Prices en Stripe y actualizar la tabla saas_plans.
 *
 * Uso: npx tsx scripts/stripe-setup.ts
 *
 * Requisitos:
 *   - STRIPE_SECRET_KEY en .env
 *   - La tabla saas_plans debe existir con los planes seed
 *   - La base de datos debe estar corriendo
 */
import 'dotenv/config';
import Stripe from 'stripe';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-04-30.basil',
});

const db = new Kysely<any>({
    dialect: new PostgresDialect({
        pool: new Pool({ connectionString: process.env.DATABASE_URL }),
    }),
});

interface SeedPlan {
    id: string;
    name: string;
    description: string | null;
    price: string;
    currency: string;
    interval: string;
    stripe_price_id: string | null;
}

async function main() {
    console.log('Fetching plans from database...');

    const plans: SeedPlan[] = await db
        .selectFrom('saas_plans')
        .selectAll()
        .where('is_active', '=', true)
        .execute();

    console.log(`Found ${plans.length} active plans\n`);

    for (const plan of plans) {
        const price = parseFloat(plan.price);

        if (price === 0) {
            console.log(`⏭ Skipping "${plan.name}" (free plan)`);
            continue;
        }

        if (plan.stripe_price_id) {
            console.log(`⏭ Skipping "${plan.name}" (already has stripe_price_id: ${plan.stripe_price_id})`);
            continue;
        }

        console.log(`Creating Stripe product for "${plan.name}"...`);

        const product = await stripe.products.create({
            name: `Danzity - ${plan.name}`,
            description: plan.description || undefined,
        });

        const stripePrice = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(price * 100),
            currency: plan.currency.toLowerCase(),
            recurring: {
                interval: plan.interval === 'year' ? 'year' : 'month',
            },
        });

        await db
            .updateTable('saas_plans')
            .set({ stripe_price_id: stripePrice.id })
            .where('id', '=', plan.id)
            .execute();

        console.log(`  Product: ${product.id}`);
        console.log(`  Price:   ${stripePrice.id}`);
        console.log(`  Updated saas_plans.stripe_price_id\n`);
    }

    console.log('Done! Stripe setup complete.');

    const updatedPlans = await db
        .selectFrom('saas_plans')
        .select(['name', 'stripe_price_id'])
        .execute();

    console.log('\nCurrent plan configuration:');
    console.table(updatedPlans);

    await db.destroy();
    process.exit(0);
}

main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
