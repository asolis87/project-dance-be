import { db } from '../../lib/db';
import type { CreateGroupDTO, UpdateGroupDTO } from './groups.schema';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/helpers/errors';

export class GroupsService {
  /**
   * Listar grupos de una academia con paginación y búsqueda.
   */
  async list(organizationId: string, page: number, pageSize: number, search?: string) {
    let query = db
      .selectFrom('dance_group')
      .where('dance_group.organization_id', '=', organizationId);

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('dance_group.name', 'ilike', `%${search}%`),
          eb('dance_group.description', 'ilike', `%${search}%`),
        ]),
      );
    }

    const total = await query
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    const items = await query
      .innerJoin('instructor', 'instructor.id', 'dance_group.instructor_id')
      .select([
        'dance_group.id',
        'dance_group.name',
        'dance_group.description',
        'dance_group.schedule',
        'dance_group.capacity',
        'dance_group.is_active',
        'dance_group.created_at',
        'dance_group.updated_at',
        'instructor.name as instructor_name',
        'instructor.id as instructor_id',
      ])
      .orderBy('dance_group.created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return { items, total: Number(total.count) };
  }

  /**
   * Obtener detalle de un grupo con alumnos inscritos.
   */
  async getById(organizationId: string, id: string) {
    const group = await db
      .selectFrom('dance_group')
      .innerJoin('instructor', 'instructor.id', 'dance_group.instructor_id')
      .where('dance_group.id', '=', id)
      .where('dance_group.organization_id', '=', organizationId)
      .select([
        'dance_group.id',
        'dance_group.organization_id',
        'dance_group.name',
        'dance_group.description',
        'dance_group.schedule',
        'dance_group.capacity',
        'dance_group.is_active',
        'dance_group.created_at',
        'dance_group.updated_at',
        'instructor.name as instructor_name',
        'instructor.id as instructor_id',
      ])
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError('Grupo', id);
    }

    // Obtener alumnos inscritos activamente
    const enrolledStudents = await db
      .selectFrom('enrollment')
      .innerJoin('student', 'student.id', 'enrollment.student_id')
      .where('enrollment.group_id', '=', id)
      .where('enrollment.is_active', '=', true)
      .select([
        'student.id',
        'student.name',
        'student.email',
        'student.affiliation_number',
        'enrollment.enrolled_at',
      ])
      .orderBy('student.name', 'asc')
      .execute();

    const enrolledCount = enrolledStudents.length;
    const availableSlots = group.capacity - enrolledCount;

    return {
      ...group,
      enrolled_count: enrolledCount,
      available_slots: availableSlots,
      students: enrolledStudents,
    };
  }

  /**
   * Crear un nuevo grupo.
   */
  async create(organizationId: string, data: CreateGroupDTO) {
    // Verificar que el instructor existe en la misma academia
    const instructor = await db
      .selectFrom('instructor')
      .where('id', '=', data.instructor_id)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!instructor) {
      throw new NotFoundError('Instructor', data.instructor_id);
    }

    const group = await db
      .insertInto('dance_group')
      .values({
        organization_id: organizationId,
        instructor_id: data.instructor_id,
        name: data.name,
        description: data.description ?? null,
        schedule: data.schedule ?? null,
        capacity: data.capacity,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return group;
  }

  /**
   * Actualizar un grupo existente.
   */
  async update(organizationId: string, id: string, data: UpdateGroupDTO) {
    // Verificar existencia
    const existing = await db
      .selectFrom('dance_group')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .executeTakeFirst();

    if (!existing) {
      throw new NotFoundError('Grupo', id);
    }

    // Si cambia instructor, verificar que existe
    if (data.instructor_id) {
      const instructor = await db
        .selectFrom('instructor')
        .where('id', '=', data.instructor_id)
        .where('organization_id', '=', organizationId)
        .select('id')
        .executeTakeFirst();

      if (!instructor) {
        throw new NotFoundError('Instructor', data.instructor_id);
      }
    }

    const updated = await db
      .updateTable('dance_group')
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
   * Eliminar un grupo.
   */
  async delete(organizationId: string, id: string) {
    const existing = await db
      .selectFrom('dance_group')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .executeTakeFirst();

    if (!existing) {
      throw new NotFoundError('Grupo', id);
    }

    // Verificar alumnos inscritos activos
    const activeEnrollments = await db
      .selectFrom('enrollment')
      .where('group_id', '=', id)
      .where('is_active', '=', true)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    if (Number(activeEnrollments.count) > 0) {
      throw new ConflictError(
        `No se puede eliminar el grupo. Tiene ${activeEnrollments.count} alumno(s) inscrito(s). Desinscríbelos primero.`,
      );
    }

    await db
      .deleteFrom('dance_group')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .execute();
  }

  /**
   * Inscribir alumno en un grupo.
   */
  async enrollStudent(organizationId: string, groupId: string, studentId: string) {
    // Verificar grupo
    const group = await db
      .selectFrom('dance_group')
      .where('id', '=', groupId)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError('Grupo', groupId);
    }

    // Verificar alumno
    const student = await db
      .selectFrom('student')
      .where('id', '=', studentId)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError('Alumno', studentId);
    }

    // Verificar si ya está inscrito activamente
    const existingEnrollment = await db
      .selectFrom('enrollment')
      .where('group_id', '=', groupId)
      .where('student_id', '=', studentId)
      .where('is_active', '=', true)
      .select('id')
      .executeTakeFirst();

    if (existingEnrollment) {
      throw new ConflictError('El alumno ya está inscrito en este grupo.');
    }

    // Verificar cupo disponible
    const enrolledCount = await db
      .selectFrom('enrollment')
      .where('group_id', '=', groupId)
      .where('is_active', '=', true)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    if (Number(enrolledCount.count) >= group.capacity) {
      throw new ValidationError('No hay cupo disponible en este grupo.');
    }

    const enrollment = await db
      .insertInto('enrollment')
      .values({
        group_id: groupId,
        student_id: studentId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return enrollment;
  }

  /**
   * Desinscribir alumno de un grupo.
   */
  async unenrollStudent(organizationId: string, groupId: string, studentId: string) {
    // Verificar grupo pertenece a la academia
    const group = await db
      .selectFrom('dance_group')
      .where('id', '=', groupId)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError('Grupo', groupId);
    }

    // Verificar inscripción activa
    const enrollment = await db
      .selectFrom('enrollment')
      .where('group_id', '=', groupId)
      .where('student_id', '=', studentId)
      .where('is_active', '=', true)
      .select('id')
      .executeTakeFirst();

    if (!enrollment) {
      throw new NotFoundError('Inscripción activa');
    }

    await db
      .updateTable('enrollment')
      .set({
        is_active: false,
        unenrolled_at: new Date(),
      })
      .where('id', '=', enrollment.id)
      .execute();
  }
}

export const groupsService = new GroupsService();
