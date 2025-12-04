import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fjwt from '@fastify/jwt';
import authModule from './modules/auth';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fastifyCookie from '@fastify/cookie';

const buildApp = (): FastifyInstance => {
  const app = fastify({ logger: true });

  app.register(fjwt, {
    secret: process.env.JWT_SECRET || 'supersecret123' 
  });

  app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'mi-secreto-para-cookies-super-seguro', 
    hook: 'onRequest', 
  });

  // 2. Crear un decorador "authenticate" para proteger rutas
  // Esto nos permitirá usar `onRequest: [app.authenticate]` luego
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Configuración global de Zod para Fastify
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(authModule);

  return app;
};

export default buildApp;