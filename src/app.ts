import fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRawBody from 'fastify-raw-body';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import FastifyBetterAuth from 'fastify-better-auth';
import fp from 'fastify-plugin';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { auth } from './lib/auth';
import { checkHealth } from './lib/health';
import { logger } from './lib/logger';
import { getRequestId } from './shared/helpers/audit';
import { authRoutes } from './modules/auth/auth.routes';
import { instructorsRoutes } from './modules/instructors';
import { studentsRoutes } from './modules/students';
import { groupsRoutes } from './modules/groups';
import { attendanceRoutes } from './modules/attendance';
import { paymentsRoutes } from './modules/payments';
import { reportsRoutes } from './modules/reports';
import { saasSubscriptionRoutes } from './modules/saas-subscription';
import { AppError } from './shared/helpers/errors';
import { initCronJobs } from './lib/cron';

const buildApp = (): FastifyInstance => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const app = fastify({
    logger: isProduction ? logger : true,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  // Request ID hook para logging
  app.addHook('onRequest', async (request) => {
    request.log.info({ 
      url: request.url, 
      method: request.method,
    }, 'Incoming request');
  });

  // Hook de respuesta
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      url: request.url,
      method: request.method,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'Request completed');
  });

  // Security Headers
  app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  // Rate Limiting global
  app.register(fastifyRateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: '1 minute',
    allowList: ['/health'],
    keyGenerator: (request) => 
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || request.ip,
  });

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

  // 1. Raw body (necesario para verificar firma de Stripe webhooks)
  app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    runFirst: true,
    routes: ['/api/saas/webhooks/stripe'],
  });

  // CORS - debe ir antes que el handler de auth
  app.register(fastifyCors, {
    origin: process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(',').map((o) => o.trim())
      : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  });

  // Better Auth - registra automáticamente las rutas /api/auth/*
  app.register(
    fp(async (instance) => {
      await instance.register(FastifyBetterAuth, { auth });
    }),
  );

  // Rutas custom del módulo auth (ej: /auth/me)
  app.register(authRoutes, { prefix: '/auth' });

  // Módulos de negocio (scoped por academia)
  app.register(instructorsRoutes, { prefix: '/api/academies/:academyId/instructors' });
  app.register(studentsRoutes, { prefix: '/api/academies/:academyId/students' });
  app.register(groupsRoutes, { prefix: '/api/academies/:academyId/groups' });
  app.register(attendanceRoutes, { prefix: '/api/academies/:academyId/attendance' });
  app.register(paymentsRoutes, { prefix: '/api/academies/:academyId' });
  app.register(reportsRoutes, { prefix: '/api/academies/:academyId/reports' });

  // Módulo SaaS (Planes y Suscripciones)
  app.register(saasSubscriptionRoutes, { prefix: '/api/saas' });

  // Inicializar cron jobs (recordatorios de pago, etc.)
  app.addHook('onReady', () => {
    initCronJobs();
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    const health = await checkHealth();
    const statusCode = health.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(health);
  });

  return app;
};

export default buildApp;
