import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAcademy } from '../../lib/academy-middleware';
import { studentsService } from './students.service';
import {
  createStudentSchema,
  updateStudentSchema,
  studentParamsSchema,
  academyParamsSchema,
} from './students.schema';
import { searchPaginationSchema } from '../../shared/schemas/pagination.schema';
import { success, paginated, buildPagination } from '../../shared/helpers/response';

export async function studentsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // GET / - Listar alumnos
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
      const { items, total } = await studentsService.list(academyId, page, pageSize, search);
      return paginated(reply, items, buildPagination(page, pageSize, total));
    },
  );

  // POST / - Crear alumno
  server.post(
    '/',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: createStudentSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const student = await studentsService.create(academyId, request.body);
      return success(reply, student, 201);
    },
  );

  // GET /:id - Obtener alumno
  server.get(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: { params: studentParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const student = await studentsService.getById(academyId, id);
      return success(reply, student);
    },
  );

  // PUT /:id - Actualizar alumno
  server.put(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: {
        params: studentParamsSchema,
        body: updateStudentSchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const student = await studentsService.update(academyId, id, request.body);
      return success(reply, student);
    },
  );

  // DELETE /:id - Eliminar alumno
  server.delete(
    '/:id',
    {
      onRequest: [requireAcademy],
      schema: { params: studentParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      await studentsService.delete(academyId, id);
      return reply.status(204).send();
    },
  );

  // GET /:id/groups - Historial de grupos
  server.get(
    '/:id/groups',
    {
      onRequest: [requireAcademy],
      schema: { params: studentParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const groups = await studentsService.getGroupHistory(academyId, id);
      return success(reply, groups);
    },
  );

  // GET /:id/payments - Historial de pagos
  server.get(
    '/:id/payments',
    {
      onRequest: [requireAcademy],
      schema: { params: studentParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const payments = await studentsService.getPaymentHistory(academyId, id);
      return success(reply, payments);
    },
  );

  // GET /:id/qr - Generar/obtener QR
  server.get(
    '/:id/qr',
    {
      onRequest: [requireAcademy],
      schema: { params: studentParamsSchema },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const qr = await studentsService.generateQR(academyId, id);
      return success(reply, qr);
    },
  );
}
