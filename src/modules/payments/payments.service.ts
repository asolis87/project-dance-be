import { db } from '../../lib/db';
import { sql } from 'kysely';
import type { CreateMembershipDTO, CreatePaymentDTO } from './payments.schema';
import { NotFoundError, ValidationError } from '../../shared/helpers/errors';

export class PaymentsService {
  /**
   * Listar membresías con filtro por estado.
   */
  async listMemberships(
    organizationId: string,
    page: number,
    pageSize: number,
    status?: string,
  ) {
    // Query base con filtros (compartida entre conteo y paginación)
    let baseQuery = db
      .selectFrom('membership')
      .where('membership.organization_id', '=', organizationId);

    if (status === 'expiring_soon') {
      // Membresías que vencen en los próximos 7 días
      baseQuery = baseQuery
        .where('membership.status', '=', 'active')
        .where('membership.end_date', '>=', new Date())
        .where('membership.end_date', '<=', sql<Date>`CURRENT_DATE + interval '7 days'`);
    } else if (status === 'expired') {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('membership.status', '=', 'expired'),
          eb.and([
            eb('membership.status', '=', 'active'),
            eb('membership.end_date', '<', new Date()),
          ]),
        ]),
      );
    } else if (status === 'active') {
      baseQuery = baseQuery
        .where('membership.status', '=', 'active')
        .where('membership.end_date', '>=', new Date());
    } else if (status === 'cancelled') {
      baseQuery = baseQuery.where('membership.status', '=', 'cancelled');
    }

    // Conteo total con los mismos filtros aplicados
    const total = await baseQuery
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    // Items paginados con join para datos del alumno
    const items = await baseQuery
      .innerJoin('student', 'student.id', 'membership.student_id')
      .select([
        'membership.id',
        'membership.start_date',
        'membership.end_date',
        'membership.amount',
        'membership.status',
        'membership.created_at',
        'student.id as student_id',
        'student.name as student_name',
        'student.email as student_email',
        'student.affiliation_number',
      ])
      .orderBy('membership.end_date', 'asc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return { items, total: Number(total.count) };
  }

  /**
   * Crear una nueva membresía.
   */
  async createMembership(organizationId: string, data: CreateMembershipDTO) {
    // Verificar alumno
    const student = await db
      .selectFrom('student')
      .where('id', '=', data.student_id)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError('Alumno', data.student_id);
    }

    // Validar fechas
    if (new Date(data.end_date) <= new Date(data.start_date)) {
      throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio.');
    }

    const membership = await db
      .insertInto('membership')
      .values({
        student_id: data.student_id,
        organization_id: organizationId,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        amount: data.amount,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return membership;
  }

  /**
   * Listar pagos con filtros.
   */
  async listPayments(
    organizationId: string,
    page: number,
    pageSize: number,
    from?: string,
    to?: string,
  ) {
    // Query base con filtros (compartida entre conteo y paginación)
    let baseQuery = db
      .selectFrom('payment')
      .where('payment.organization_id', '=', organizationId);

    if (from) {
      baseQuery = baseQuery.where('payment.paid_at', '>=', new Date(from));
    }
    if (to) {
      baseQuery = baseQuery.where('payment.paid_at', '<=', new Date(to + 'T23:59:59Z'));
    }

    // Conteo total con los mismos filtros aplicados
    const total = await baseQuery
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    // Items paginados con join para datos del alumno
    const items = await baseQuery
      .innerJoin('student', 'student.id', 'payment.student_id')
      .select([
        'payment.id',
        'payment.amount',
        'payment.paid_at',
        'payment.type',
        'payment.notes',
        'payment.created_at',
        'payment.membership_id',
        'student.id as student_id',
        'student.name as student_name',
        'student.email as student_email',
      ])
      .orderBy('payment.paid_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    return { items, total: Number(total.count) };
  }

  /**
   * Calcula el período en meses de una membresía (diferencia entre start_date y end_date).
   * Usa aritmética de meses para respetar el calendario (ej: Feb 12 → Mar 12 = 1 mes).
   */
  private calculatePeriodMonths(startDate: Date, endDate: Date): number {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())
    );
  }

  /**
   * Registrar un pago.
   * Si es pago completo ('full'), extiende la membresía:
   * - Vigente (end_date >= hoy): extiende end_date sumando el período original
   * - Expirada (end_date < hoy): reinicia desde hoy con el mismo período
   */
  async createPayment(organizationId: string, data: CreatePaymentDTO) {
    // Verificar membresía
    const membership = await db
      .selectFrom('membership')
      .where('id', '=', data.membership_id)
      .where('organization_id', '=', organizationId)
      .selectAll()
      .executeTakeFirst();

    if (!membership) {
      throw new NotFoundError('Membresía', data.membership_id);
    }

    // Verificar alumno
    const student = await db
      .selectFrom('student')
      .where('id', '=', data.student_id)
      .where('organization_id', '=', organizationId)
      .select('id')
      .executeTakeFirst();

    if (!student) {
      throw new NotFoundError('Alumno', data.student_id);
    }

    const payment = await db
      .insertInto('payment')
      .values({
        membership_id: data.membership_id,
        student_id: data.student_id,
        organization_id: organizationId,
        amount: data.amount,
        type: data.type,
        notes: data.notes ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Si es pago completo, extender la membresía
    let updatedMembership = membership;
    if (data.type === 'full') {
      const periodMonths = this.calculatePeriodMonths(
        new Date(membership.start_date),
        new Date(membership.end_date),
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentEndDate = new Date(membership.end_date);
      currentEndDate.setHours(0, 0, 0, 0);

      let newStartDate: Date;
      let newEndDate: Date;

      if (currentEndDate >= today) {
        // Membresía vigente: extender desde el end_date actual
        newStartDate = new Date(membership.start_date);
        newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + periodMonths);
      } else {
        // Membresía expirada: reiniciar desde hoy
        newStartDate = new Date(today);
        newEndDate = new Date(today);
        newEndDate.setMonth(newEndDate.getMonth() + periodMonths);
      }

      updatedMembership = await db
        .updateTable('membership')
        .set({
          start_date: newStartDate,
          end_date: newEndDate,
          status: 'active',
        })
        .where('id', '=', membership.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return {
      ...payment,
      membership: {
        id: updatedMembership.id,
        start_date: updatedMembership.start_date,
        end_date: updatedMembership.end_date,
        status: updatedMembership.status,
        previous_end_date: membership.end_date,
      },
    };
  }
}

export const paymentsService = new PaymentsService();
