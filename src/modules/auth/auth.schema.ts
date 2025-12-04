import { z } from 'zod';

// Esquema para el registro
export const createUserSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" })
});

// Esquema de entrada para Login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Esquema de respuesta para Login (Éxito)
export const loginResponseSchema = z.object({
  accessToken: z.string(),
});

// Esquema de respuesta para errores
export const errorResponseSchema = z.object({
  error: z.string(),
});

// Extraemos el tipo de TS automáticamente del esquema
export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;