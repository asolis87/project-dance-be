import { db } from '../../lib/db';
import { sql } from 'kysely';

export class ReportsService {
  /**
   * Dashboard con KPIs principales de la academia.
   */
  async getDashboard(organizationId: string) {
    // Total alumnos activos
    const totalStudents = await db
      .selectFrom('student')
      .where('organization_id', '=', organizationId)
      .where('is_active', '=', true)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    // Total instructores activos
    const totalInstructors = await db
      .selectFrom('instructor')
      .where('organization_id', '=', organizationId)
      .where('is_active', '=', true)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    // Total grupos activos
    const totalGroups = await db
      .selectFrom('dance_group')
      .where('organization_id', '=', organizationId)
      .where('is_active', '=', true)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    // Ingresos del mes actual
    const monthlyRevenue = await db
      .selectFrom('payment')
      .where('organization_id', '=', organizationId)
      .where('paid_at', '>=', sql<Date>`date_trunc('month', CURRENT_DATE)`)
      .select(sql<string>`COALESCE(SUM(amount), 0)`.as('total'))
      .executeTakeFirstOrThrow();

    // Membresías por vencer (próximos 7 días)
    const expiringMemberships = await db
      .selectFrom('membership')
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'active')
      .where('end_date', '>=', new Date())
      .where('end_date', '<=', sql<Date>`CURRENT_DATE + interval '7 days'`)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    // Membresías vencidas (activas pero con end_date pasada)
    const expiredMemberships = await db
      .selectFrom('membership')
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'active')
      .where('end_date', '<', new Date())
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    // Asistencias este mes
    const monthlyAttendance = await db
      .selectFrom('attendance')
      .innerJoin('dance_group', 'dance_group.id', 'attendance.group_id')
      .where('dance_group.organization_id', '=', organizationId)
      .where('attendance.registered_at', '>=', sql<Date>`date_trunc('month', CURRENT_DATE)`)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    return {
      students: {
        total_active: Number(totalStudents.count),
      },
      instructors: {
        total_active: Number(totalInstructors.count),
      },
      groups: {
        total_active: Number(totalGroups.count),
      },
      revenue: {
        monthly: monthlyRevenue.total,
      },
      memberships: {
        expiring_soon: Number(expiringMemberships.count),
        expired: Number(expiredMemberships.count),
      },
      attendance: {
        monthly_total: Number(monthlyAttendance.count),
      },
    };
  }

  /**
   * Reporte de asistencia por grupo y rango de fechas.
   */
  async getAttendanceReport(
    organizationId: string,
    from?: string,
    to?: string,
    groupId?: string,
  ) {
    let query = db
      .selectFrom('attendance')
      .innerJoin('student', 'student.id', 'attendance.student_id')
      .innerJoin('dance_group', 'dance_group.id', 'attendance.group_id')
      .where('dance_group.organization_id', '=', organizationId);

    if (from) {
      query = query.where('attendance.date', '>=', new Date(from));
    }
    if (to) {
      query = query.where('attendance.date', '<=', new Date(to));
    }
    if (groupId) {
      query = query.where('attendance.group_id', '=', groupId);
    }

    // Asistencia por alumno
    const byStudent = await db
      .selectFrom('attendance')
      .innerJoin('student', 'student.id', 'attendance.student_id')
      .innerJoin('dance_group', 'dance_group.id', 'attendance.group_id')
      .where('dance_group.organization_id', '=', organizationId)
      .$if(!!from, (q) => q.where('attendance.date', '>=', new Date(from!)))
      .$if(!!to, (q) => q.where('attendance.date', '<=', new Date(to!)))
      .$if(!!groupId, (q) => q.where('attendance.group_id', '=', groupId!))
      .groupBy(['student.id', 'student.name'])
      .select([
        'student.id as student_id',
        'student.name as student_name',
        db.fn.countAll<number>().as('total_attendance'),
      ])
      .orderBy('total_attendance', 'desc')
      .execute();

    // Asistencia por día
    const byDate = await db
      .selectFrom('attendance')
      .innerJoin('dance_group', 'dance_group.id', 'attendance.group_id')
      .where('dance_group.organization_id', '=', organizationId)
      .$if(!!from, (q) => q.where('attendance.date', '>=', new Date(from!)))
      .$if(!!to, (q) => q.where('attendance.date', '<=', new Date(to!)))
      .$if(!!groupId, (q) => q.where('attendance.group_id', '=', groupId!))
      .groupBy('attendance.date')
      .select([
        'attendance.date',
        db.fn.countAll<number>().as('total'),
      ])
      .orderBy('attendance.date', 'desc')
      .execute();

    return {
      by_student: byStudent,
      by_date: byDate,
    };
  }

  /**
   * Reporte de ingresos por rango de fechas.
   */
  async getRevenueReport(organizationId: string, from?: string, to?: string) {
    // Total en el período
    let totalQuery = db
      .selectFrom('payment')
      .where('organization_id', '=', organizationId);

    if (from) {
      totalQuery = totalQuery.where('paid_at', '>=', new Date(from));
    }
    if (to) {
      totalQuery = totalQuery.where('paid_at', '<=', new Date(to + 'T23:59:59Z'));
    }

    const totalResult = await totalQuery
      .select(sql<string>`COALESCE(SUM(amount), 0)`.as('total'))
      .executeTakeFirstOrThrow();

    // Ingresos por mes
    const byMonth = await db
      .selectFrom('payment')
      .where('organization_id', '=', organizationId)
      .$if(!!from, (q) => q.where('paid_at', '>=', new Date(from!)))
      .$if(!!to, (q) => q.where('paid_at', '<=', new Date(to! + 'T23:59:59Z')))
      .groupBy(sql`to_char(paid_at, 'YYYY-MM')`)
      .select([
        sql<string>`to_char(paid_at, 'YYYY-MM')`.as('month'),
        sql<string>`SUM(amount)`.as('total'),
        db.fn.countAll<number>().as('payment_count'),
      ])
      .orderBy(sql`to_char(paid_at, 'YYYY-MM')`, 'desc')
      .execute();

    // Por tipo de pago
    const byType = await db
      .selectFrom('payment')
      .where('organization_id', '=', organizationId)
      .$if(!!from, (q) => q.where('paid_at', '>=', new Date(from!)))
      .$if(!!to, (q) => q.where('paid_at', '<=', new Date(to! + 'T23:59:59Z')))
      .groupBy('type')
      .select([
        'type',
        sql<string>`SUM(amount)`.as('total'),
        db.fn.countAll<number>().as('count'),
      ])
      .execute();

    return {
      total: totalResult.total,
      by_month: byMonth,
      by_type: byType,
    };
  }
}

export const reportsService = new ReportsService();
