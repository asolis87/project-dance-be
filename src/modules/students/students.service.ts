import { db } from '../../lib/db';
import QRCode from 'qrcode';
import type { CreateStudentDTO, UpdateStudentDTO } from './students.schema';
import { NotFoundError, ConflictError } from '../../shared/helpers/errors';

export class StudentsService {
  /**
   * Listar alumnos de una academia con paginación y búsqueda.
   */
  async list(organizationId: string, page: number, pageSize: number, search?: string) {
    let query = db
      .selectFrom('student')
      .where('organization_id', '=', organizationId);

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('email', 'ilike', `%${search}%`),
          eb('affiliation_number', 'ilike', `%${search}%`),
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
   * Obtener un alumno por ID.
   */
  async getById(organizationId: string, id: string) {
    const student = await db
      .selectFrom('student')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError('Alumno', id);
    }

    return student;
  }

  /**
   * Crear un nuevo alumno.
   * Genera automáticamente el código QR de acceso.
   */
  async create(organizationId: string, data: CreateStudentDTO) {
    const existing = await db
      .selectFrom('student')
      .where('organization_id', '=', organizationId)
      .where('email', '=', data.email)
      .select('id')
      .executeTakeFirst();

    if (existing) {
      throw new ConflictError(`Ya existe un alumno con el email "${data.email}" en esta academia.`);
    }

    const student = await db
      .insertInto('student')
      .values({
        organization_id: organizationId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Generar QR automáticamente
    const qrData = JSON.stringify({
      affiliationNumber: student.affiliation_number,
      studentId: student.id,
      organizationId,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    const updatedStudent = await db
      .updateTable('student')
      .set({ qr_code: qrCodeDataUrl, updated_at: new Date() })
      .where('id', '=', student.id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return updatedStudent;
  }

  /**
   * Actualizar un alumno existente.
   */
  async update(organizationId: string, id: string, data: UpdateStudentDTO) {
    await this.getById(organizationId, id);

    if (data.email) {
      const existing = await db
        .selectFrom('student')
        .where('organization_id', '=', organizationId)
        .where('email', '=', data.email)
        .where('id', '!=', id)
        .select('id')
        .executeTakeFirst();

      if (existing) {
        throw new ConflictError(`Ya existe un alumno con el email "${data.email}" en esta academia.`);
      }
    }

    const updated = await db
      .updateTable('student')
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
   * Eliminar un alumno.
   */
  async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id);

    await db
      .deleteFrom('student')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .execute();
  }

  /**
   * Obtener historial de grupos de un alumno.
   */
  async getGroupHistory(organizationId: string, studentId: string) {
    await this.getById(organizationId, studentId);

    const enrollments = await db
      .selectFrom('enrollment')
      .innerJoin('dance_group', 'dance_group.id', 'enrollment.group_id')
      .where('enrollment.student_id', '=', studentId)
      .where('dance_group.organization_id', '=', organizationId)
      .select([
        'dance_group.id as group_id',
        'dance_group.name as group_name',
        'dance_group.schedule_days',
        'dance_group.start_time',
        'dance_group.end_time',
        'dance_group.is_active as group_active',
        'enrollment.enrolled_at',
        'enrollment.unenrolled_at',
        'enrollment.is_active as enrollment_active',
      ])
      .orderBy('enrollment.enrolled_at', 'desc')
      .execute();

    return enrollments;
  }

  /**
   * Obtener historial de pagos de un alumno.
   */
  async getPaymentHistory(organizationId: string, studentId: string) {
    await this.getById(organizationId, studentId);

    const payments = await db
      .selectFrom('payment')
      .where('student_id', '=', studentId)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .orderBy('paid_at', 'desc')
      .execute();

    return payments;
  }

  /**
   * Generar código QR para un alumno.
   */
  async generateQR(organizationId: string, studentId: string) {
    const student = await this.getById(organizationId, studentId);

    // El QR contiene el número de afiliación
    const qrData = JSON.stringify({
      affiliationNumber: student.affiliation_number,
      studentId: student.id,
      organizationId,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    // Guardar QR en el registro del alumno
    await db
      .updateTable('student')
      .set({ qr_code: qrCodeDataUrl, updated_at: new Date() })
      .where('id', '=', studentId)
      .where('organization_id', '=', organizationId)
      .execute();

    return { qr_code: qrCodeDataUrl, affiliation_number: student.affiliation_number };
  }
}

export const studentsService = new StudentsService();
