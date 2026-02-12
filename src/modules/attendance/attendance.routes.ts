import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAcademy } from '../../lib/academy-middleware';
import { attendanceService } from './attendance.service';
import {
  registerByQRSchema,
  registerByNumberSchema,
  registerManualSchema,
  attendanceHistoryParamsSchema,
  attendanceHistoryQuerySchema,
  academyParamsSchema,
} from './attendance.schema';
import { success } from '../../shared/helpers/response';

export async function attendanceRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // POST /qr - Registrar asistencia por QR
  server.post(
    '/qr',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: registerByQRSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const attendance = await attendanceService.registerByQR(academyId, request.body);
      return success(reply, attendance, 201);
    },
  );

  // POST /number - Registrar asistencia por número de afiliación
  server.post(
    '/number',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: registerByNumberSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const attendance = await attendanceService.registerByNumber(academyId, request.body);
      return success(reply, attendance, 201);
    },
  );

  // POST /manual - Registrar asistencia manual
  server.post(
    '/manual',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: registerManualSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const attendance = await attendanceService.registerManual(academyId, request.body);
      return success(reply, attendance, 201);
    },
  );

  // GET /groups/:id/attendance - Historial de asistencia de un grupo
  // Nota: Esta ruta se registra bajo el prefix de groups, no attendance.
  // La registramos aquí como una ruta nested.
  server.get(
    '/groups/:id',
    {
      onRequest: [requireAcademy],
      schema: {
        params: attendanceHistoryParamsSchema,
        querystring: attendanceHistoryQuerySchema,
      },
    },
    async (request, reply) => {
      const { academyId, id } = request.params;
      const { from, to } = request.query;
      const records = await attendanceService.getGroupAttendance(academyId, id, from, to);
      return success(reply, records);
    },
  );
}
