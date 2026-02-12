import fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import FastifyBetterAuth from 'fastify-better-auth';
import fp from 'fastify-plugin';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { auth } from './lib/auth';
import { authRoutes } from './modules/auth/auth.routes';
import { instructorsRoutes } from './modules/instructors';
import { studentsRoutes } from './modules/students';
import { groupsRoutes } from './modules/groups';
import { attendanceRoutes } from './modules/attendance';
import { paymentsRoutes } from './modules/payments';
import { reportsRoutes } from './modules/reports';
import { AppError } from './shared/helpers/errors';
import { initCronJobs } from './lib/cron';

const buildApp = (): FastifyInstance => {
  const app = fastify({ logger: true });

  // Type provider de Zod para validación automática
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Error handler global
  app.setErrorHandler((error: Error & { validation?: unknown; statusCode?: number }, request, reply) => {
    // Errores de la aplicación (AppError y subclases)
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        ...('details' in error && { details: (error as any).details }),
      });
    }

    // Errores de validación de Zod (via fastify-type-provider-zod)
    if (error.validation) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        message: 'Error de validación en la solicitud',
        details: error.validation,
      });
    }

    // Errores inesperados
    request.log.error(error);
    return reply.status(error.statusCode ?? 500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error interno del servidor',
    });
  });

  // 1. CORS - debe ir antes que el handler de auth
  app.register(fastifyCors, {
    origin: process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(',').map((o) => o.trim())
      : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  });

  // 2. Better Auth - registra automáticamente las rutas /api/auth/*
  app.register(
    fp(async (instance) => {
      await instance.register(FastifyBetterAuth, { auth });
    }),
  );

  // 3. Rutas custom del módulo auth (ej: /auth/me)
  app.register(authRoutes, { prefix: '/auth' });

  // 4. Módulos de negocio (scoped por academia)
  app.register(instructorsRoutes, { prefix: '/api/academies/:academyId/instructors' });
  app.register(studentsRoutes, { prefix: '/api/academies/:academyId/students' });
  app.register(groupsRoutes, { prefix: '/api/academies/:academyId/groups' });
  app.register(attendanceRoutes, { prefix: '/api/academies/:academyId/attendance' });
  app.register(paymentsRoutes, { prefix: '/api/academies/:academyId' });
  app.register(reportsRoutes, { prefix: '/api/academies/:academyId/reports' });

  // 5. Inicializar cron jobs (recordatorios de pago, etc.)
  app.addHook('onReady', () => {
    initCronJobs();
  });

  return app;
};

export default buildApp;
