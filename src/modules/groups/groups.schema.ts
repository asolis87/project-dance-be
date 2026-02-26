import { z } from 'zod/v4';

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const timeRegex = /^\d{2}:\d{2}$/;

export const createGroupSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(200),
    instructor_id: z.string().uuid('ID de instructor inválido'),
    description: z.string().max(500).optional(),
    schedule_days: z
      .array(z.enum(VALID_DAYS))
      .min(1, 'Selecciona al menos un día'),
    start_time: z.string().regex(timeRegex, 'Formato HH:MM requerido'),
    end_time: z.string().regex(timeRegex, 'Formato HH:MM requerido'),
    capacity: z.number().int().min(1, 'La capacidad mínima es 1'),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['end_time'],
  });

export type CreateGroupDTO = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    instructor_id: z.string().uuid().optional(),
    description: z.string().max(500).nullable().optional(),
    schedule_days: z.array(z.enum(VALID_DAYS)).min(1).optional(),
    start_time: z.string().regex(timeRegex).optional(),
    end_time: z.string().regex(timeRegex).optional(),
    capacity: z.number().int().min(1).optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Solo validar si ambos están presentes
      if (data.start_time && data.end_time) {
        return data.end_time > data.start_time;
      }
      return true;
    },
    {
      message: 'La hora de fin debe ser posterior a la hora de inicio',
      path: ['end_time'],
    },
  );

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
