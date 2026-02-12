import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAuthDecorator } from 'fastify-better-auth';
import { auth } from './auth';

/**
 * Middleware que:
 * 1. Verifica que el usuario esté autenticado.
 * 2. Extrae el academyId de los params de la ruta.
 * 3. Verifica que el usuario sea miembro de la academia (organización).
 * 4. Adjunta la sesión, academyId y organización al request.
 */
export async function requireAcademy(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Pasar typeof auth.options para inferir correctamente los métodos de plugins (organization)
  const authInstance = getAuthDecorator<typeof auth.options>(this);

  // 1. Verificar sesión
  const session = await authInstance.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user) {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'No autorizado. Debes iniciar sesión para acceder a este recurso.',
    });
  }

  // 2. Extraer academyId
  const { academyId } = request.params as { academyId?: string };
  if (!academyId) {
    return reply.status(400).send({
      error: 'BAD_REQUEST',
      message: 'Se requiere el ID de la academia.',
    });
  }

  // 3. Verificar membresía en la organización via Better Auth API
  try {
    const org = await authInstance.api.getFullOrganization({
      headers: fromNodeHeaders(request.headers),
      query: { organizationId: academyId },
    });

    if (!org) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'No tienes acceso a esta academia.',
      });
    }

    // 4. Adjuntar al request
    (request as any).session = session;
    (request as any).academyId = academyId;
    (request as any).organization = org;
  } catch {
    return reply.status(403).send({
      error: 'FORBIDDEN',
      message: 'No tienes acceso a esta academia.',
    });
  }
}
