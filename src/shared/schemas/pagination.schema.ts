import { z } from 'zod/v4';

/**
 * Schema de query params para paginación.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * Schema de query params para búsqueda con paginación.
 */
export const searchPaginationSchema = paginationSchema.extend({
  search: z.string().optional(),
});

export type SearchPaginationQuery = z.infer<typeof searchPaginationSchema>;
