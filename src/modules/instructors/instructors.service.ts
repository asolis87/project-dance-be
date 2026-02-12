import { db } from '../../lib/db';
import type { CreateInstructorDTO, UpdateInstructorDTO } from './instructors.schema';
import { NotFoundError, ConflictError } from '../../shared/helpers/errors';

export class InstructorsService {
  /**
   * Listar instructores de una academia con paginación y búsqueda.
   */
  async list(organizationId: string, page: number, pageSize: number, search?: string) {
    let query = db
      .selectFrom('instructor')
      .where('organization_id', '=', organizationId);

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('email', 'ilike', `%${search}%`),
          eb('specialization', 'ilike', `%${search}%`),
        ]),
      );
    }

    const total = await query
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    const items = await query
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return { items, total: Number(total.count) };
  }

  /**
   * Obtener un instructor por ID.
   */
  async getById(organizationId: string, id: string) {
    const instructor = await db
      .selectFrom('instructor')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .executeTakeFirst();

    if (!instructor) {
      throw new NotFoundError('Instructor', id);
    }

    return instructor;
  }

  /**
   * Crear un nuevo instructor.
   */
  async create(organizationId: string, data: CreateInstructorDTO) {
    // Verificar email duplicado dentro de la academia
    const existing = await db
      .selectFrom('instructor')
      .where('organization_id', '=', organizationId)
      .where('email', '=', data.email)
      .select('id')
      .executeTakeFirst();

    if (existing) {
      throw new ConflictError(`Ya existe un instructor con el email "${data.email}" en esta academia.`);
    }

    const instructor = await db
      .insertInto('instructor')
      .values({
        organization_id: organizationId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        specialization: data.specialization ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return instructor;
  }

  /**
   * Actualizar un instructor existente.
   */
  async update(organizationId: string, id: string, data: UpdateInstructorDTO) {
    // Verificar que existe
    await this.getById(organizationId, id);

    // Si cambia email, verificar duplicado
    if (data.email) {
      const existing = await db
        .selectFrom('instructor')
        .where('organization_id', '=', organizationId)
        .where('email', '=', data.email)
        .where('id', '!=', id)
        .select('id')
        .executeTakeFirst();

      if (existing) {
        throw new ConflictError(`Ya existe un instructor con el email "${data.email}" en esta academia.`);
      }
    }

    const updated = await db
      .updateTable('instructor')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return updated;
  }

  /**
   * Eliminar un instructor (soft delete: desactiva).
   */
  async delete(organizationId: string, id: string) {
    // Verificar que existe
    await this.getById(organizationId, id);

    // Verificar si tiene grupos activos
    const activeGroups = await db
      .selectFrom('dance_group')
      .where('instructor_id', '=', id)
      .where('is_active', '=', true)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    if (Number(activeGroups.count) > 0) {
      throw new ConflictError(
        `No se puede eliminar el instructor. Tiene ${activeGroups.count} grupo(s) activo(s). Reasigna los grupos primero.`,
      );
    }

    await db
      .deleteFrom('instructor')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .execute();
  }

  /**
   * Obtener historial de grupos de un instructor.
   */
  async getGroupHistory(organizationId: string, instructorId: string) {
    // Verificar que existe
    await this.getById(organizationId, instructorId);

    const groups = await db
      .selectFrom('dance_group')
      .where('instructor_id', '=', instructorId)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return groups;
  }
}

export const instructorsService = new InstructorsService();
