import { z } from 'zod/v4';

export const createMembershipSchema = z.object({
  student_id: z.string().uuid('ID de alumno inválido'),
  start_date: z.string().date('Fecha de inicio inválida'),
  end_date: z.string().date('Fecha de fin inválida'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
});

export type CreateMembershipDTO = z.infer<typeof createMembershipSchema>;

export const createPaymentSchema = z.object({
  membership_id: z.string().uuid('ID de membresía inválido'),
  student_id: z.string().uuid('ID de alumno inválido'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  type: z.enum(['full', 'partial']),
  notes: z.string().max(500).optional(),
});

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;

export const membershipQuerySchema = z.object({
  status: z.enum(['active', 'expired', 'cancelled', 'expiring_soon']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const paymentQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const academyParamsSchema = z.object({
  academyId: z.string(),
});
