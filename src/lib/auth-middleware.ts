import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAuthDecorator } from 'fastify-better-auth';

/**
 * Hook reutilizable para proteger rutas.
 * Verifica la sesión del usuario mediante Better Auth.
 * Si no hay sesión válida, retorna 401.
 * Si hay sesión, la adjunta al request como `request.session`.
 */
export async function requireAuth(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authInstance = getAuthDecorator(this);

  const session = await authInstance.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user) {
    return reply.status(401).send({
      error: 'No autorizado. Debes iniciar sesión para acceder a este recurso.',
    });
  }

  // Adjuntamos la sesión al request para que las rutas puedan accederla
  (request as any).session = session;
}
