import { z } from 'zod/v4';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  instructor_id: z.string().uuid('ID de instructor inválido'),
  description: z.string().max(500).optional(),
  schedule: z.string().max(200).optional(),
  capacity: z.number().int().min(1, 'La capacidad mínima es 1'),
});

export type CreateGroupDTO = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  instructor_id: z.string().uuid().optional(),
  description: z.string().max(500).nullable().optional(),
  schedule: z.string().max(200).nullable().optional(),
  capacity: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateGroupDTO = z.infer<typeof updateGroupSchema>;

export const enrollStudentSchema = z.object({
  student_id: z.string().uuid('ID de alumno inválido'),
});

export type EnrollStudentDTO = z.infer<typeof enrollStudentSchema>;

export const groupParamsSchema = z.object({
  academyId: z.string(),
  id: z.string().uuid(),
});

export const unenrollParamsSchema = z.object({
  academyId: z.string(),
  id: z.string().uuid(),
  studentId: z.string().uuid(),
});

export const academyParamsSchema = z.object({
  academyId: z.string(),
});
