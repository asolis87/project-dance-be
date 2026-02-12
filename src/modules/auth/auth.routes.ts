import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../lib/auth-middleware';

export async function authRoutes(app: FastifyInstance) {
  /**
   * GET /auth/me
   * Ruta protegida que retorna la información del usuario autenticado.
   * Requiere una sesión válida de Better Auth (cookie de sesión).
   */
  app.get(
    '/me',
    {
      onRequest: [requireAuth],
    },
    async (request) => {
      const { user, session } = (request as any).session;
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      };
    },
  );
}
