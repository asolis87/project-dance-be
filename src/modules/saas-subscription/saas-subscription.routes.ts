import type { FastifyInstance } from 'fastify';
import { stripeCheckoutSchema, planResponseSchema } from './saas-subscription.schema';
import { SaasSubscriptionService } from './saas-subscription.service';
import { requireAuth } from '../../lib/auth-middleware';
import { requireAcademy } from '../../lib/academy-middleware';
import { z } from 'zod';

export async function saasSubscriptionRoutes(app: FastifyInstance) {
    const service = new SaasSubscriptionService();

    // List Plans (Authenticated users)
    app.get(
        '/plans',
        {
            onRequest: [requireAuth],
            schema: {
                description: 'List available SaaS plans',
                tags: ['SaaS'],
                response: {
                    200: z.array(planResponseSchema),
                },
            },
        },
        async (request, reply) => {
            const plans = await service.listPlans();
            return plans;
        }
    );

    // Organization Subscription Management
    app.register(async (orgRoutes) => {
        orgRoutes.addHook('onRequest', requireAcademy);

        // Get Current Subscription
        orgRoutes.get(
            '/organizations/:academyId/subscription',
            {
                schema: {
                    description: 'Get current subscription for an organization',
                    tags: ['SaaS'],
                    params: z.object({ academyId: z.string() }),
                },
            },
            async (request, reply) => {
                const { academyId } = request as any;
                const subscription = await service.getSubscription(academyId);
                if (!subscription) {
                    return reply.status(404).send({ message: 'No active subscription found' });
                }
                return subscription;
            }
        );

        // Create Stripe Checkout Session
        orgRoutes.post(
            '/organizations/:academyId/checkout',
            {
                schema: {
                    description: 'Create a Stripe Checkout Session for subscription',
                    tags: ['SaaS', 'Stripe'],
                    params: z.object({ academyId: z.string() }),
                    body: stripeCheckoutSchema,
                },
            },
            async (request, reply) => {
                const { academyId } = request as any;
                const { planId, successUrl, cancelUrl } = request.body as z.infer<typeof stripeCheckoutSchema>;

                try {
                    const result = await service.createCheckoutSession(academyId, planId, successUrl, cancelUrl);
                    return reply.send(result);
                } catch (error: any) {
                    if (error.statusCode) {
                        return reply.status(error.statusCode).send({ message: error.message });
                    }
                    request.log.error(error, 'Error creating Stripe checkout session');
                    return reply.status(500).send({ message: error.message || 'Error creating checkout session' });
                }
            }
        );

        // Stripe Customer Portal
        orgRoutes.post(
            '/organizations/:academyId/portal',
            {
                schema: {
                    description: 'Create a Stripe Customer Portal session',
                    tags: ['SaaS', 'Stripe'],
                    params: z.object({ academyId: z.string() }),
                },
            },
            async (request, reply) => {
                const { academyId } = request as any;
                try {
                    const result = await service.createPortalSession(academyId);
                    return reply.send(result);
                } catch (error: any) {
                    if (error.statusCode) {
                        return reply.status(error.statusCode).send({ message: error.message });
                    }
                    request.log.error(error, 'Error creating Stripe portal session');
                    return reply.status(500).send({ message: error.message || 'Error creating portal session' });
                }
            }
        );

        // Cancel Subscription
        orgRoutes.post(
            '/organizations/:academyId/cancel',
            {
                schema: {
                    description: 'Cancel the active subscription at end of period',
                    tags: ['SaaS', 'Stripe'],
                    params: z.object({ academyId: z.string() }),
                },
            },
            async (request, reply) => {
                const { academyId } = request as any;
                try {
                    const result = await service.cancelSubscription(academyId);
                    return reply.send(result);
                } catch (error: any) {
                    if (error.statusCode) {
                        return reply.status(error.statusCode).send({ message: error.message });
                    }
                    request.log.error(error, 'Error canceling subscription');
                    return reply.status(500).send({ message: error.message || 'Error canceling subscription' });
                }
            }
        );
    });

    // Stripe Webhook (Public - no auth required)
    app.post(
        '/webhooks/stripe',
        {
            schema: {
                description: 'Stripe Webhook endpoint',
                tags: ['Webhooks'],
            },
            config: {
                rawBody: true,
            },
        },
        async (request, reply) => {
            const signature = request.headers['stripe-signature'] as string;

            if (!signature) {
                return reply.status(400).send({ message: 'Missing stripe-signature header' });
            }

            try {
                const rawBody = (request as any).rawBody || request.body;
                await service.handleWebhook(rawBody, signature);
                return reply.status(200).send({ received: true });
            } catch (error: any) {
                request.log.error(error, 'Error processing Stripe webhook');
                return reply.status(400).send({ message: error.message || 'Webhook error' });
            }
        }
    );
}
