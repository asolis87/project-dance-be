import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAcademy } from '../../lib/academy-middleware';
import { instructorsService } from './instructors.service';
import {
  createInstructorSchema,
  updateInstructorSchema,
  instructorParamsSchema,
  academyParamsSchema,
} from './instructors.schema';
import { searchPaginationSchema } from '../../shared/schemas/pagination.schema';
import { success, paginated, buildPagination } from '../../shared/helpers/response';

export async function instructorsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // GET /api/academies/:academyId/instructors - Listar instructores
  server.get(
    '/',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        querystring: searchPaginationSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const { page, pageSize, search } = request.query;

      const { items, total } = await instructorsService.list(
        academyId,
        page,
        pageSize,
        search,
      );

      return paginated(reply, items, buildPagination(page, pageSize, total));
    },
  );

  // POST /api/academies/:academyId/instructors - Crear instructor
  server.post(
    '/',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: createInstructorSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const instructor = await instructorsService.create(academyId, request.body);
      return success(reply, instructor, 201);
    },
  );

  // GET /api/academies/:academyId/instructors/:id - Obtener instructor
  server.get(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: {
        params: instructorParamsSchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const instructor = await instructorsService.getById(academyId, id);
      return success(reply, instructor);
    },
  );

  // PUT /api/academies/:academyId/instructors/:id - Actualizar instructor
  server.put(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: {
        params: instructorParamsSchema,
        body: updateInstructorSchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const instructor = await instructorsService.update(academyId, id, request.body);
      return success(reply, instructor);
    },
  );

  // DELETE /api/academies/:academyId/instructors/:id - Eliminar instructor
  server.delete(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: {
        params: instructorParamsSchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      await instructorsService.delete(academyId, id);
      return reply.status(204).send();
    },
  );

  // GET /api/academies/:academyId/instructors/:id/groups - Historial de grupos
  server.get(
    '/:id/groups',
    {
      onRequest: [requireAcademy],
      schema: {
        params: instructorParamsSchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const groups = await instructorsService.getGroupHistory(academyId, id);
      return success(reply, groups);
    },
  );
}
