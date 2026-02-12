import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstructorsService } from './instructors.service';

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

import { db } from '../../lib/db';

const mockDb = db as any;

describe('InstructorsService', () => {
  let service: InstructorsService;

  beforeEach(() => {
    service = new InstructorsService();
    vi.clearAllMocks();

    // Reset chain behavior
    for (const key of Object.keys(mockDb)) {
      if (typeof mockDb[key] === 'function' && key !== 'fn') {
        mockDb[key].mockReturnValue(mockDb);
      }
    }
  });

  describe('list', () => {
    it('debe retornar lista paginada de instructores', async () => {
      const mockInstructors = [
        { id: '1', name: 'Carlos', email: 'carlos@test.com', organization_id: 'org-1' },
        { id: '2', name: 'María', email: 'maria@test.com', organization_id: 'org-1' },
      ];

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 2 });
      mockDb.execute.mockResolvedValueOnce(mockInstructors);

      const result = await service.list('org-1', 1, 10);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('instructor');
      expect(mockDb.where).toHaveBeenCalledWith('organization_id', '=', 'org-1');
    });

    it('debe aplicar filtro de búsqueda cuando se proporciona', async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });
      mockDb.execute.mockResolvedValueOnce([
        { id: '1', name: 'Carlos', email: 'carlos@test.com' },
      ]);

      const result = await service.list('org-1', 1, 10, 'Carlos');

      expect(result.items).toHaveLength(1);
      // Verifica que se llamó where con una función (el callback or())
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('debe respetar paginación', async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 25 });
      mockDb.execute.mockResolvedValueOnce([]);

      await service.list('org-1', 2, 10);

      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(10); // (page - 1) * pageSize = (2-1)*10
    });
  });

  describe('getById', () => {
    it('debe retornar el instructor cuando existe', async () => {
      const mockInstructor = {
        id: 'inst-1',
        name: 'Carlos',
        email: 'carlos@test.com',
        organization_id: 'org-1',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(mockInstructor);

      const result = await service.getById('org-1', 'inst-1');

      expect(result).toEqual(mockInstructor);
      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'inst-1');
      expect(mockDb.where).toHaveBeenCalledWith('organization_id', '=', 'org-1');
    });

    it('debe lanzar NotFoundError cuando no existe', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.getById('org-1', 'no-existe')).rejects.toThrow('no encontrado');
    });
  });

  describe('create', () => {
    it('debe crear un instructor correctamente', async () => {
      const newInstructor = {
        name: 'Carlos Pérez',
        email: 'carlos@test.com',
        phone: '5551234567',
        specialization: 'Salsa',
      };

      // No hay duplicado
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      const created = {
        id: 'inst-new',
        organization_id: 'org-1',
        ...newInstructor,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(created);

      const result = await service.create('org-1', newInstructor);

      expect(result.id).toBe('inst-new');
      expect(result.name).toBe('Carlos Pérez');
      expect(mockDb.insertInto).toHaveBeenCalledWith('instructor');
    });

    it('debe lanzar ConflictError si el email ya existe', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.create('org-1', {
          name: 'Duplicado',
          email: 'existing@test.com',
        }),
      ).rejects.toThrow('Ya existe un instructor');
    });
  });

  describe('delete', () => {
    it('debe eliminar un instructor sin grupos activos', async () => {
      // getById mock
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'inst-1', name: 'Carlos' });
      // Conteo de grupos activos
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 0 });
      // deleteFrom
      mockDb.execute.mockResolvedValueOnce([]);

      await expect(service.delete('org-1', 'inst-1')).resolves.toBeUndefined();
      expect(mockDb.deleteFrom).toHaveBeenCalledWith('instructor');
    });

    it('debe lanzar ConflictError si tiene grupos activos', async () => {
      // getById mock
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'inst-1', name: 'Carlos' });
      // Conteo de grupos activos = 2
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 2 });

      await expect(service.delete('org-1', 'inst-1')).rejects.toThrow(
        'No se puede eliminar el instructor',
      );
    });
  });
});
