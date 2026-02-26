import { z } from 'zod';

export const createPlanSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
    currency: z.string().default('USD'),
    interval: z.enum(['month', 'year']),
    features: z.record(z.string(), z.any()).optional(),
    stripePriceId: z.string().optional(),
});

export const subscribeSchema = z.object({
    planId: z.string().uuid(),
});

export const stripeCheckoutSchema = z.object({
    planId: z.string().uuid(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
});

export const planResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.string(),
    currency: z.string(),
    interval: z.string(),
    features: z.unknown(),
    is_active: z.boolean(),
});
