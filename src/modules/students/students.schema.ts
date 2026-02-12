import { z } from 'zod/v4';

export const createStudentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  email: z.email('Email inválido'),
  phone: z.string().max(20).optional(),
});

export type CreateStudentDTO = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.email('Email inválido').optional(),
  phone: z.string().max(20).nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateStudentDTO = z.infer<typeof updateStudentSchema>;

export const studentParamsSchema = z.object({
  academyId: z.string(),
  id: z.string().uuid(),
});

export const academyParamsSchema = z.object({
  academyId: z.string(),
});
