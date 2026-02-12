import { z } from 'zod/v4';

export const registerByQRSchema = z.object({
  qr_data: z.string().min(1, 'Datos de QR requeridos'),
  group_id: z.string().uuid('ID de grupo inválido'),
});

export type RegisterByQRDTO = z.infer<typeof registerByQRSchema>;

export const registerByNumberSchema = z.object({
  affiliation_number: z.string().min(1, 'Número de afiliación requerido'),
  group_id: z.string().uuid('ID de grupo inválido'),
});

export type RegisterByNumberDTO = z.infer<typeof registerByNumberSchema>;

export const registerManualSchema = z.object({
  student_id: z.string().uuid('ID de alumno inválido'),
  group_id: z.string().uuid('ID de grupo inválido'),
});

export type RegisterManualDTO = z.infer<typeof registerManualSchema>;

export const attendanceHistoryParamsSchema = z.object({
  academyId: z.string(),
  id: z.string().uuid(),
});

export const attendanceHistoryQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export const academyParamsSchema = z.object({
  academyId: z.string(),
});
