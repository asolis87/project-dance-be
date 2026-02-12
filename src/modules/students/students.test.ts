import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentsService } from './students.service';

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

// Mock de QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
  },
}));

import { db } from '../../lib/db';

const mockDb = db as any;

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(() => {
    service = new StudentsService();
    vi.clearAllMocks();

    for (const key of Object.keys(mockDb)) {
      if (typeof mockDb[key] === 'function' && key !== 'fn') {
        mockDb[key].mockReturnValue(mockDb);
      }
    }
  });

  describe('list', () => {
    it('debe retornar lista paginada de alumnos', async () => {
      const mockStudents = [
        { id: '1', name: 'Ana López', email: 'ana@test.com', affiliation_number: 'ALU-001' },
        { id: '2', name: 'Pedro García', email: 'pedro@test.com', affiliation_number: 'ALU-002' },
      ];

      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 2 });
      mockDb.execute.mockResolvedValueOnce(mockStudents);

      const result = await service.list('org-1', 1, 10);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('student');
    });

    it('debe aplicar filtro de búsqueda por nombre, email o número de afiliación', async () => {
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });
      mockDb.execute.mockResolvedValueOnce([
        { id: '1', name: 'Ana López', email: 'ana@test.com' },
      ]);

      const result = await service.list('org-1', 1, 10, 'Ana');

      expect(result.items).toHaveLength(1);
      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('debe retornar el alumno cuando existe', async () => {
      const mockStudent = {
        id: 'stu-1',
        name: 'Ana López',
        email: 'ana@test.com',
        organization_id: 'org-1',
        affiliation_number: 'ALU-001',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStudent);

      const result = await service.getById('org-1', 'stu-1');

      expect(result).toEqual(mockStudent);
    });

    it('debe lanzar NotFoundError cuando no existe', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.getById('org-1', 'no-existe')).rejects.toThrow('no encontrado');
    });
  });

  describe('create', () => {
    it('debe crear un alumno correctamente', async () => {
      // No hay duplicado
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      const created = {
        id: 'stu-new',
        organization_id: 'org-1',
        name: 'Ana López',
        email: 'ana@test.com',
        phone: null,
        affiliation_number: 'ALU-001',
        qr_code: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(created);

      const result = await service.create('org-1', {
        name: 'Ana López',
        email: 'ana@test.com',
      });

      expect(result.id).toBe('stu-new');
      expect(result.affiliation_number).toBe('ALU-001');
      expect(mockDb.insertInto).toHaveBeenCalledWith('student');
    });

    it('debe lanzar ConflictError si el email ya existe', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.create('org-1', {
          name: 'Duplicada',
          email: 'existing@test.com',
        }),
      ).rejects.toThrow('Ya existe un alumno');
    });
  });

  describe('delete', () => {
    it('debe eliminar un alumno existente', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce({ id: 'stu-1', name: 'Ana' });
      mockDb.execute.mockResolvedValueOnce([]);

      await expect(service.delete('org-1', 'stu-1')).resolves.toBeUndefined();
      expect(mockDb.deleteFrom).toHaveBeenCalledWith('student');
    });

    it('debe lanzar NotFoundError si el alumno no existe', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      await expect(service.delete('org-1', 'no-existe')).rejects.toThrow('no encontrado');
    });
  });

  describe('generateQR', () => {
    it('debe generar código QR para un alumno', async () => {
      const mockStudent = {
        id: 'stu-1',
        name: 'Ana',
        affiliation_number: 'ALU-001',
        organization_id: 'org-1',
      };

      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStudent);
      mockDb.execute.mockResolvedValueOnce([]);

      const result = await service.generateQR('org-1', 'stu-1');

      expect(result.qr_code).toContain('data:image/png;base64');
      expect(result.affiliation_number).toBe('ALU-001');
    });
  });
});
