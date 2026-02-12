import type { FastifyReply } from 'fastify';

/**
 * Interfaz de paginación estándar.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Respuesta exitosa con un solo recurso.
 */
export function success<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.status(statusCode).send({ data });
}

/**
 * Respuesta exitosa con lista paginada.
 */
export function paginated<T>(
  reply: FastifyReply,
  items: T[],
  pagination: PaginationMeta,
) {
  return reply.status(200).send({
    data: items,
    pagination,
  });
}

/**
 * Calcula los metadatos de paginación.
 */
export function buildPagination(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Respuesta de error estándar.
 */
export function errorResponse(
  reply: FastifyReply,
  statusCode: number,
  error: string,
  message: string,
  details?: Record<string, string[]>,
) {
  return reply.status(statusCode).send({
    error,
    message,
    ...(details && { details }),
  });
}
