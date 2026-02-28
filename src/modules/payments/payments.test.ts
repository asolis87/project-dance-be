import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsService } from './payments.service';

// Mock del módulo de base de datos
vi.mock('../../lib/db', () => {
  const mockChain = () => {
    const chain: Record<string, any> = {};
    const methods = [
      'selectFrom',
      'insertInto',
      'updateTable',
      'deleteFrom',
      'where',
      'select',
      'selectAll',
      'innerJoin',
      'leftJoin',
      'orderBy',
      'limit',
      'offset',
      'values',
      'set',
      'returningAll',
      'executeTakeFirst',
      'executeTakeFirstOrThrow',
      'execute',
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.fn = { countAll: vi.fn().mockReturnValue({ as: vi.fn().mockReturnValue('count_expr') }) };
    return chain;
  };

  return { db: mockChain() };
});

vi.mock('kysely', async (importOriginal) => {
  const original = await importOriginal<typeof import('kysely')>();
  return {
    ...original,
    sql: new Proxy(original.sql, {
      apply: () => 'mock-sql',
      get: (target, prop) => (target as any)[prop],
    }),
  };
});

import { db } from '../../lib/db';

const mockDb = db as any;

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    service = new PaymentsService();
    vi.clearAllMocks();

    for (const key of Object.keys(mockDb)) {
      if (typeof mockDb[key] === 'function' && key !== 'fn') {
        mockDb[key].mockReturnValue(mockDb);
      }
    }
  });

  describe('listMemberships', () => {
    it('debe retornar lista paginada de membresías', async () => {
      const mockMemberships = [
        {
          id: 'mem-1',
          student_name: 'Ana',
          student_email: 'ana@test.com',
          start_date: new Date('2026-01-01'),
          end_date: new Date('2026-02-01'),
          amount: '500.00',
          status: 'active',
        },
      ];

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });
      mockDb.execute.mockResolvedValueOnce(mockMemberships);

      const result = await service.listMemberships('org-1', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('membership');
    });

    it('debe aplicar filtro de status "active"', async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });
      mockDb.execute.mockResolvedValueOnce([]);

      await service.listMemberships('org-1', 1, 10, 'active');

      // Verifica que where fue llamado con el status
      expect(mockDb.where).toHaveBeenCalledWith('membership.status', '=', 'active');
    });

    it('debe aplicar filtro de status "cancelled"', async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });
      mockDb.execute.mockResolvedValueOnce([]);

      await service.listMemberships('org-1', 1, 10, 'cancelled');

      expect(mockDb.where).toHaveBeenCalledWith('membership.status', '=', 'cancelled');
    });

    it('debe respetar paginación correctamente', async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 50 });
      mockDb.execute.mockResolvedValueOnce([]);

      await service.listMemberships('org-1', 3, 20);

      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(mockDb.offset).toHaveBeenCalledWith(40); // (3-1)*20
    });
  });

  describe('createMembership', () => {
    it('debe crear una membresía correctamente', async () => {
      // Alumno existe
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'stu-1' });

      const created = {
        id: 'mem-new',
        student_id: 'stu-1',
        organization_id: 'org-1',
        start_date: new Date('2026-02-01'),
        end_date: new Date('2026-03-01'),
        amount: '500.00',
        status: 'active',
      };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(created);

      const result = await service.createMembership('org-1', {
        student_id: 'stu-1',
        start_date: '2026-02-01',
        end_date: '2026-03-01',
        amount: '500.00',
      });

      expect(result.id).toBe('mem-new');
      expect(mockDb.insertInto).toHaveBeenCalledWith('membership');
    });

    it('debe lanzar NotFoundError si el alumno no existe', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(
        service.createMembership('org-1', {
          student_id: 'no-existe',
          start_date: '2026-02-01',
          end_date: '2026-03-01',
          amount: '500.00',
        }),
      ).rejects.toThrow('no encontrado');
    });

    it('debe validar que end_date > start_date', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'stu-1' });

      await expect(
        service.createMembership('org-1', {
          student_id: 'stu-1',
          start_date: '2026-03-01',
          end_date: '2026-02-01', // Antes de start_date
          amount: '500.00',
        }),
      ).rejects.toThrow('fecha de fin debe ser posterior');
    });
  });

  describe('listPayments', () => {
    it('debe retornar lista paginada de pagos', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          student_name: 'Ana',
          amount: '500.00',
          paid_at: new Date(),
          type: 'full',
        },
      ];

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });
      mockDb.execute.mockResolvedValueOnce(mockPayments);

      const result = await service.listPayments('org-1', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('payment');
    });

    it('debe aplicar filtros de rango de fechas', async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });
      mockDb.execute.mockResolvedValueOnce([]);

      await service.listPayments('org-1', 1, 10, '2026-01-01', '2026-01-31');

      // Verifica que where fue llamado con las fechas
      expect(mockDb.where).toHaveBeenCalledWith(
        'payment.paid_at',
        '>=',
        new Date('2026-01-01'),
      );
      expect(mockDb.where).toHaveBeenCalledWith(
        'payment.paid_at',
        '<=',
        new Date('2026-01-31T23:59:59Z'),
      );
    });
  });

  describe('createPayment', () => {
    it('debe registrar un pago correctamente', async () => {
      // Membresía existe
      mockDb.executeTakeFirst
        .mockResolvedValueOnce({
          id: 'mem-1',
          organization_id: 'org-1',
          status: 'active',
        })
        // Alumno existe
        .mockResolvedValueOnce({ id: 'stu-1' });

      const created = {
        id: 'pay-new',
        membership_id: 'mem-1',
        student_id: 'stu-1',
        organization_id: 'org-1',
        amount: '500.00',
        type: 'full',
        notes: null,
      };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(created);

      const result = await service.createPayment('org-1', {
        membership_id: 'mem-1',
        student_id: 'stu-1',
        amount: '500.00',
        type: 'full',
      });

      expect(result.id).toBe('pay-new');
      expect(mockDb.insertInto).toHaveBeenCalledWith('payment');
    });

    it('debe lanzar NotFoundError si la membresía no existe', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(
        service.createPayment('org-1', {
          membership_id: 'no-existe',
          student_id: 'stu-1',
          amount: '500.00',
          type: 'full',
        }),
      ).rejects.toThrow('no encontrad');
    });

    it('debe reactivar membresía expirada en pago completo', async () => {
      // Membresía expirada
      mockDb.executeTakeFirst
        .mockResolvedValueOnce({
          id: 'mem-1',
          organization_id: 'org-1',
          status: 'expired',
          end_date: new Date('2025-01-01'),
        })
        // Alumno existe
        .mockResolvedValueOnce({ id: 'stu-1' });

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({
        id: 'pay-new',
        type: 'full',
      });
      mockDb.execute.mockResolvedValueOnce([]); // updateTable result

      await service.createPayment('org-1', {
        membership_id: 'mem-1',
        student_id: 'stu-1',
        amount: '500.00',
        type: 'full',
      });

      // Verifica que se actualizó la membresía
      expect(mockDb.updateTable).toHaveBeenCalledWith('membership');
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      );
    });
  });
});
