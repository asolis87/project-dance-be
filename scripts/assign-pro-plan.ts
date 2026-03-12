/**
 * Script para asignar el plan Pro a una organización específica.
 *
 * Uso: npx tsx scripts/assign-pro-plan.ts
 *
 * Requisitos:
 *   - DATABASE_URL en .env
 *   - La tabla saas_plans debe existir con los planes seed (010_seed_saas_plans.ts)
 *   - La base de datos debe estar corriendo
 *
 * Comportamiento:
 *   - Si la organización ya tiene una suscripción activa, la cancela y crea una nueva.
 *   - Si no tiene suscripción, crea una nueva activa.
 *   - La suscripción creada NO tiene stripe_subscription_id (es manual, sin pago Stripe).
 */
import 'dotenv/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const ORGANIZATION_ID = 'F66pMNHqOUl3SM0Ko3fDWCcJMD5evEw7';
const PRO_PLAN_NAME = 'Pro';

const db = new Kysely<any>({
    dialect: new PostgresDialect({
        pool: new Pool({ connectionString: process.env.DATABASE_URL }),
    }),
});

async function main() {
    console.log(`Asignando plan "${PRO_PLAN_NAME}" a organización: ${ORGANIZATION_ID}\n`);

    // 1. Buscar el plan Pro
    const proPlan = await db
        .selectFrom('saas_plans')
        .select(['id', 'name', 'price'])
        .where('name', '=', PRO_PLAN_NAME)
        .where('is_active', '=', true)
        .executeTakeFirst();

    if (!proPlan) {
        console.error(`Error: No se encontró el plan "${PRO_PLAN_NAME}" activo en saas_plans.`);
        process.exit(1);
    }

    console.log(`Plan encontrado: ${proPlan.name} (id: ${proPlan.id}, precio: $${proPlan.price}/mes)`);

    // 2. Verificar si la organización ya tiene una suscripción activa
    const existingSub = await db
        .selectFrom('saas_subscriptions')
        .select(['id', 'plan_id', 'status'])
        .where('organization_id', '=', ORGANIZATION_ID)
        .where('status', '=', 'active')
        .executeTakeFirst();

    if (existingSub) {
        console.log(`\nSuscripción activa existente encontrada (id: ${existingSub.id}, plan_id: ${existingSub.plan_id})`);

        if (existingSub.plan_id === proPlan.id) {
            console.log('La organización ya tiene el plan Pro activo. No se requieren cambios.');
            await db.destroy();
            process.exit(0);
        }

        console.log('Cancelando suscripción anterior...');
        await db
            .updateTable('saas_subscriptions')
            .set({ status: 'canceled', updated_at: new Date() })
            .where('id', '=', existingSub.id)
            .execute();

        console.log(`Suscripción ${existingSub.id} cancelada.`);
    }

    // 3. Crear nueva suscripción Pro
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const newSub = await db
        .insertInto('saas_subscriptions')
        .values({
            organization_id: ORGANIZATION_ID,
            plan_id: proPlan.id,
            status: 'active',
            stripe_subscription_id: null,
            current_period_start: now,
            current_period_end: oneYearFromNow,
            cancel_at_period_end: false,
        })
        .returning(['id', 'organization_id', 'plan_id', 'status', 'current_period_start', 'current_period_end'])
        .executeTakeFirstOrThrow();

    console.log('\n✓ Suscripción Pro creada exitosamente:');
    console.table([newSub]);

    await db.destroy();
    process.exit(0);
}

main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
