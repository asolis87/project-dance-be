import { db } from '../../lib/db';
import type {
  RegisterByQRDTO,
  RegisterByNumberDTO,
  RegisterManualDTO,
} from './attendance.schema';
import { NotFoundError, ValidationError } from '../../shared/helpers/errors';

export class AttendanceService {
  /**
   * Verificar que el alumno tiene membresía activa.
   */
  private async checkActiveMembership(studentId: string, organizationId: string) {
    const membership = await db
      .selectFrom('membership')
      .where('student_id', '=', studentId)
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'active')
      .where('end_date', '>=', new Date())
      .select('id')
      .executeTakeFirst();

    if (!membership) {
      throw new ValidationError('Membresía vencida - Contacta administración', {
        membership: ['El alumno no tiene una membresía activa o ya venció.'],
      });
    }
  }

  /**
   * Verificar que el alumno está inscrito en el grupo.
   */
  private async checkEnrollment(studentId: string, groupId: string) {
    const enrollment = await db
      .selectFrom('enrollment')
      .where('student_id', '=', studentId)
      .where('group_id', '=', groupId)
      .where('is_active', '=', true)
      .select('id')
      .executeTakeFirst();

    if (!enrollment) {
      throw new ValidationError('El alumno no está inscrito en este grupo.');
    }
  }

  /**
   * Registrar asistencia interna (común para los 3 métodos).
   */
  private async registerAttendance(
    studentId: string,
    groupId: string,
    organizationId: string,
    type: 'qr' | 'number' | 'manual',
  ) {
    // Verificar membresía activa
    await this.checkActiveMembership(studentId, organizationId);

    // Verificar inscripción en el grupo
    await this.checkEnrollment(studentId, groupId);

    // Registrar asistencia
    const attendance = await db
      .insertInto('attendance')
      .values({
        student_id: studentId,
        group_id: groupId,
        type,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return attendance;
  }

  /**
   * Registrar asistencia por QR.
   */
  async registerByQR(organizationId: string, data: RegisterByQRDTO) {
    // Parsear datos del QR
    let qrPayload: { studentId?: string; affiliationNumber?: string; organizationId?: string };
    try {
      qrPayload = JSON.parse(data.qr_data);
    } catch {
      throw new ValidationError('Código QR no válido.');
    }

    if (!qrPayload.studentId) {
      throw new ValidationError('Código QR no válido.');
    }

    // Verificar alumno
    const student = await db
      .selectFrom('student')
      .where('id', '=', qrPayload.studentId)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError('Alumno');
    }

    return this.registerAttendance(student.id, data.group_id, organizationId, 'qr');
  }

  /**
   * Registrar asistencia por número de afiliación.
   */
  async registerByNumber(organizationId: string, data: RegisterByNumberDTO) {
    const student = await db
      .selectFrom('student')
      .where('affiliation_number', '=', data.affiliation_number)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError('Número de afiliación no encontrado');
    }

    return this.registerAttendance(student.id, data.group_id, organizationId, 'number');
  }

  /**
   * Registrar asistencia manual.
   */
  async registerManual(organizationId: string, data: RegisterManualDTO) {
    const student = await db
      .selectFrom('student')
      .where('id', '=', data.student_id)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError('Alumno', data.student_id);
    }

    return this.registerAttendance(student.id, data.group_id, organizationId, 'manual');
  }

  /**
   * Obtener historial de asistencia de un grupo.
   */
  async getGroupAttendance(
    organizationId: string,
    groupId: string,
    from?: string,
    to?: string,
  ) {
    // Verificar grupo
    const group = await db
      .selectFrom('dance_group')
      .where('id', '=', groupId)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError('Grupo', groupId);
    }

    let query = db
      .selectFrom('attendance')
      .innerJoin('student', 'student.id', 'attendance.student_id')
      .where('attendance.group_id', '=', groupId)
      .select([
        'attendance.id',
        'attendance.date',
        'attendance.type',
        'attendance.registered_at',
        'student.id as student_id',
        'student.name as student_name',
        'student.affiliation_number',
      ]);

    if (from) {
      query = query.where('attendance.date', '>=', new Date(from));
    }
    if (to) {
      query = query.where('attendance.date', '<=', new Date(to));
    }

    const records = await query
      .orderBy('attendance.date', 'desc')
      .orderBy('attendance.registered_at', 'desc')
      .execute();

    return records;
  }
}

export const attendanceService = new AttendanceService();
