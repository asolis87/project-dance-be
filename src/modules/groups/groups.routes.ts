import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAcademy } from '../../lib/academy-middleware';
import { groupsService } from './groups.service';
import {
  createGroupSchema,
  updateGroupSchema,
  enrollStudentSchema,
  groupParamsSchema,
  unenrollParamsSchema,
  academyParamsSchema,
} from './groups.schema';
import { searchPaginationSchema } from '../../shared/schemas/pagination.schema';
import { success, paginated, buildPagination } from '../../shared/helpers/response';

export async function groupsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // GET / - Listar grupos
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
      const { items, total } = await groupsService.list(academyId, page, pageSize, search);
      return paginated(reply, items, buildPagination(page, pageSize, total));
    },
  );

  // POST / - Crear grupo
  server.post(
    '/',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: createGroupSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const group = await groupsService.create(academyId, request.body);
      return success(reply, group, 201);
    },
  );

  // GET /:id - Obtener detalle de grupo con alumnos
  server.get(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: { params: groupParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const group = await groupsService.getById(academyId, id);
      return success(reply, group);
    },
  );

  // PUT /:id - Actualizar grupo
  server.put(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: {
        params: groupParamsSchema,
        body: updateGroupSchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const group = await groupsService.update(academyId, id, request.body);
      return success(reply, group);
    },
  );

  // DELETE /:id - Eliminar grupo
  server.delete(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: { params: groupParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      await groupsService.delete(academyId, id);
      return reply.status(204).send();
    },
  );

  // POST /:id/enroll - Inscribir alumno
  server.post(
    '/:id/enroll',
    {
      onRequest: [requireAcademy],
      schema: {
        params: groupParamsSchema,
        body: enrollStudentSchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const enrollment = await groupsService.enrollStudent(
        academyId,
        id,
        request.body.student_id,
      );
      return success(reply, enrollment, 201);
    },
  );

  // DELETE /:id/enroll/:studentId - Desinscribir alumno
  server.delete(
    '/:id/enroll/:studentId',
    {
      onRequest: [requireAcademy],
      schema: { params: unenrollParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id, studentId } = request.params;
      await groupsService.unenrollStudent(academyId, id, studentId);
      return reply.status(204).send();
    },
  );
}
