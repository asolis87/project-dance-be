import { FastifyInstance } from "fastify";
import fp from 'fastify-plugin';
import { authRoutes } from './auth.routes';

async function authModule(server: FastifyInstance) {
    // Aquí registramos las rutas del módulo
    // 'prefix' hace que todas las rutas de authRoutes empiecen con /auth
    server.register(authRoutes, { prefix: '/auth' });

    console.log('Auth module registered');
}

export default fp(authModule);