import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';
import { requireAcademy } from '../../lib/academy-middleware';
import { reportsService } from './reports.service';
import { success } from '../../shared/helpers/response';

const academyParamsSchema = z.object({
  academyId: z.string(),
});

const reportQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  group_id: z.string().uuid().optional(),
});

export async function reportsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // GET /dashboard - KPIs principales
  server.get(
    '/dashboard',
    {
      onRequest: [requireAcademy],
      schema: { params: academyParamsSchema },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const dashboard = await reportsService.getDashboard(academyId);
      return success(reply, dashboard);
    },
  );

  // GET /attendance - Reporte de asistencia
  server.get(
    '/attendance',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        querystring: reportQuerySchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const { from, to, group_id } = request.query;
      const report = await reportsService.getAttendanceReport(academyId, from, to, group_id);
      return success(reply, report);
    },
  );

  // GET /revenue - Reporte de ingresos
  server.get(
    '/revenue',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        querystring: reportQuerySchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const { from, to } = request.query;
      const report = await reportsService.getRevenueReport(academyId, from, to);
      return success(reply, report);
    },
  );
}
