import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db } from '../src/lib/db';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';

const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
if (!mpAccessToken || mpAccessToken.includes('test-token-here')) {
    console.error('ERROR: Debes configurar MERCADOPAGO_ACCESS_TOKEN real en tu archivo .env');
    process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

async function syncPlans() {
    console.log('Iniciando sincronización de planes SaaS con Mercado Pago...');

    try {
        const plans = await db
            .selectFrom('saas_plans')
            .selectAll()
            .where('is_active', '=', true)
            .where('price', '>', 0 as any) // El plan Gratis no va a Mercado Pago
            .execute();

        for (const plan of plans) {
            console.log(`\nProcesando plan: ${plan.name} (ID Interno: ${plan.id})`);

            // Check if already synced
            if (plan.stripe_price_id) {
                console.log(`✅ Plan ${plan.name} ya tiene un ID de Mercado Pago asignado: ${plan.stripe_price_id}`);
                continue; // En el futuro se podría implementar Lógica de UPDATE de Precio
            }

            console.log(`⏳ Creando "PreApprovalPlan" en Mercado Pago para ${plan.name}...`);

            // Requerimiento mp: back_url (bebe ser una URL válida pública o formato válido)
            // Mercado Pago requiere una URL. Si BETTER_AUTH_URL es localhost, usaremos un dominio dummy local que valide
            let backUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
            if (backUrl.includes('localhost')) {
                backUrl = 'https://www.tusitio.com'; // Dummy for validation if localhost
            }

            const mpPlan = new PreApprovalPlan(client);
            const createdMpPlan = await mpPlan.create({
                body: {
                    reason: `Suscripción - Plan ${plan.name}`,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: "months",
                        transaction_amount: Number(plan.price) * 20, // Simulando conversión a MXN para la prueba
                        currency_id: "MXN" // Cuenta mexicana (MLM) exige MXN en subscriptions locales
                    },
                    back_url: `${backUrl}/dashboard?payment=success`,
                }
            });

            if (createdMpPlan.id) {
                console.log(`✅ Plan creado en MP con ID: ${createdMpPlan.id}`);

                // Actualizar DB con el ID generado
                await db
                    .updateTable('saas_plans')
                    .set({ stripe_price_id: createdMpPlan.id })
                    .where('id', '=', plan.id)
                    .execute();

                console.log(`💾 Base de datos actualizada con éxito para el plan ${plan.name}.`);
            }
        }
    } catch (error: any) {
        console.error('❌ Error al sincronizar planes con Mercado Pago:', error.message || error);
        console.error('Detalles:', error.cause?.data || error.cause || error);
        if (error.cause) console.error(error.cause);
    } finally {
        console.log('\nSincronización finalizada.');
        process.exit(0);
    }
}

syncPlans();
