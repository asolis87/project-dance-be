import Stripe from 'stripe';
import { db } from '../../lib/db';
import { config } from '../../lib/config';
import { withRetry } from '../../lib/retry';
import { logger } from '../../lib/logger';
import { NotFoundError, ConflictError } from '../../shared/helpers/errors';

export class SaasSubscriptionService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            timeout: config.stripe.timeout,
            maxNetworkRetries: config.stripe.maxRetries,
        });
    }

    async listPlans() {
        return await db
            .selectFrom('saas_plans')
            .selectAll()
            .where('is_active', '=', true)
            .execute();
    }

    async getSubscription(organizationId: string) {
        return await db
            .selectFrom('saas_subscriptions')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'active')
            .executeTakeFirst();
    }

    async createCheckoutSession(
        organizationId: string,
        planId: string,
        successUrl?: string,
        cancelUrl?: string,
    ) {
        const plan = await db
            .selectFrom('saas_plans')
            .selectAll()
            .where('id', '=', planId)
            .where('is_active', '=', true)
            .executeTakeFirst();

        if (!plan) {
            throw new NotFoundError('Plan not found or inactive');
        }

        const existingSub = await this.getSubscription(organizationId);
        if (existingSub) {
            throw new ConflictError('Organization already has an active subscription');
        }

        // Plan gratuito: se activa directamente sin pasar por Stripe
        if (parseFloat(plan.price) === 0) {
            await db
                .insertInto('saas_subscriptions')
                .values({
                    organization_id: organizationId,
                    plan_id: plan.id,
                    status: 'active',
                    stripe_subscription_id: null,
                    current_period_start: new Date(),
                    current_period_end: null,
                    cancel_at_period_end: false,
                })
                .execute();

            logger.info({ organizationId, planId: plan.id }, 'Free plan activated directly');
            return { url: null };
        }

        if (!plan.stripe_price_id) {
            throw new Error('Plan does not have an associated Stripe Price ID');
        }

        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripe_price_id,
                    quantity: 1,
                },
            ],
            metadata: {
                organization_id: organizationId,
                plan_id: planId,
            },
            success_url: successUrl || process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/subscription/success',
            cancel_url: cancelUrl || process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/subscription/cancel',
        });

        return { url: session.url };
    }

    async createPortalSession(organizationId: string) {
        const subscription = await this.getSubscription(organizationId);
        if (!subscription || !subscription.stripe_subscription_id) {
            throw new NotFoundError('No active subscription found');
        }

        const stripeSubscription = await this.stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id,
        );

        const session = await this.stripe.billingPortal.sessions.create({
            customer: stripeSubscription.customer as string,
            return_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/subscription',
        });

        return { url: session.url };
    }

    async cancelSubscription(organizationId: string) {
        const subscription = await this.getSubscription(organizationId);
        if (!subscription) {
            throw new NotFoundError('No active subscription found');
        }

        // Suscripción sin Stripe (ej: plan gratuito o asignación manual) — cancelar directo en DB
        if (!subscription.stripe_subscription_id) {
            await db
                .updateTable('saas_subscriptions')
                .set({ status: 'canceled', updated_at: new Date() })
                .where('id', '=', subscription.id)
                .execute();

            return { message: 'Subscription canceled' };
        }

        await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        await db
            .updateTable('saas_subscriptions')
            .set({ cancel_at_period_end: true, updated_at: new Date() })
            .where('id', '=', subscription.id)
            .execute();

        return { message: 'Subscription will be canceled at the end of the current period' };
    }

    async handleWebhook(payload: string | Buffer, signature: string) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === 'subscription' && session.metadata) {
                    const { organization_id, plan_id } = session.metadata;
                    const stripeSubscriptionId = typeof session.subscription === 'string'
                        ? session.subscription
                        : session.subscription?.id;

                    if (!organization_id || !plan_id || !stripeSubscriptionId) break;

                    const now = new Date();
                    const periodEnd = new Date(now);
                    periodEnd.setMonth(periodEnd.getMonth() + 1);

                    await db
                        .insertInto('saas_subscriptions')
                        .values({
                            organization_id,
                            plan_id,
                            status: 'active',
                            stripe_subscription_id: stripeSubscriptionId,
                            current_period_start: now,
                            current_period_end: periodEnd,
                        })
                        .execute();

                    logger.info({ organization_id }, 'Stripe: Subscription created');
                }
                break;
            }

            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                const stripeSubId = typeof invoice.parent?.subscription_details?.subscription === 'string'
                    ? invoice.parent.subscription_details.subscription
                    : invoice.parent?.subscription_details?.subscription?.id;

                if (!stripeSubId) break;

                await db
                    .updateTable('saas_subscriptions')
                    .set({
                        status: 'active',
                        current_period_start: new Date(invoice.period_start * 1000),
                        current_period_end: new Date(invoice.period_end * 1000),
                        updated_at: new Date(),
                    })
                    .where('stripe_subscription_id', '=', stripeSubId)
                    .execute();

                logger.info({ stripeSubId }, 'Stripe: Invoice paid');
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                await db
                    .updateTable('saas_subscriptions')
                    .set({
                        status: subscription.status === 'active' ? 'active' : subscription.status,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                        updated_at: new Date(),
                    })
                    .where('stripe_subscription_id', '=', subscription.id)
                    .execute();

                logger.info({ subscriptionId: subscription.id, status: subscription.status }, 'Stripe: Subscription updated');
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                await db
                    .updateTable('saas_subscriptions')
                    .set({
                        status: 'canceled',
                        updated_at: new Date(),
                    })
                    .where('stripe_subscription_id', '=', subscription.id)
                    .execute();

                logger.info({ subscriptionId: subscription.id }, 'Stripe: Subscription canceled');
                break;
            }

            default:
                logger.debug({ eventType: event.type }, 'Stripe: Unhandled event');
        }
    }

    async checkLimit(organizationId: string, feature: string, currentCount: number) {
        let subscription = await this.getSubscription(organizationId);
        let plan;

        if (!subscription) {
            plan = await db
                .selectFrom('saas_plans')
                .selectAll()
                .where('name', '=', 'Gratis')
                .executeTakeFirst();
        } else {
            plan = await db
                .selectFrom('saas_plans')
                .selectAll()
                .where('id', '=', subscription.plan_id)
                .executeTakeFirst();
        }

        if (!plan || !plan.features) return false;

        const features = plan.features as Record<string, any>;
        const limit = features[feature];

        if (limit === undefined || limit === -1) return true;

        return currentCount < limit;
    }
}
