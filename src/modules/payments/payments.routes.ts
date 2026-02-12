import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAcademy } from '../../lib/academy-middleware';
import { paymentsService } from './payments.service';
import {
  createMembershipSchema,
  createPaymentSchema,
  membershipQuerySchema,
  paymentQuerySchema,
  academyParamsSchema,
} from './payments.schema';
import { success, paginated, buildPagination } from '../../shared/helpers/response';

export async function paymentsRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // GET /memberships - Listar membresías
  server.get(
    '/memberships',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        querystring: membershipQuerySchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const { page, pageSize, status } = request.query;
      const { items, total } = await paymentsService.listMemberships(
        academyId,
        page,
        pageSize,
        status,
      );
      return paginated(reply, items, buildPagination(page, pageSize, total));
    },
  );

  // POST /memberships - Crear membresía
  server.post(
    '/memberships',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: createMembershipSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const membership = await paymentsService.createMembership(academyId, request.body);
      return success(reply, membership, 201);
    },
  );

  // GET /payments - Listar pagos
  server.get(
    '/payments',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        querystring: paymentQuerySchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const { page, pageSize, from, to } = request.query;
      const { items, total } = await paymentsService.listPayments(
        academyId,
        page,
        pageSize,
        from,
        to,
      );
      return paginated(reply, items, buildPagination(page, pageSize, total));
    },
  );

  // POST /payments - Registrar pago
  server.post(
    '/payments',
    {
      onRequest: [requireAcademy],
      schema: {
        params: academyParamsSchema,
        body: createPaymentSchema,
      },
    },
    async (request, reply) => {
      const { academyId } = request.params;
      const payment = await paymentsService.createPayment(academyId, request.body);
      return success(reply, payment, 201);
    },
  );
}
