import { db } from '../../lib/db';
import { sql } from 'kysely';
import { sendEmail } from '../../lib/email';

type ReminderType = '7_days_before' | '3_days_before' | 'expired';

interface MembershipToRemind {
  membership_id: string;
  student_name: string;
  student_email: string;
  end_date: Date;
  days_remaining: number;
}

/**
 * Busca membresías que necesiten recordatorio y envía emails.
 * Tipos de recordatorio:
 * - 7_days_before: membresías que vencen en 7 días
 * - 3_days_before: membresías que vencen en 3 días
 * - expired: membresías que ya vencieron (hoy)
 */
export async function processPaymentReminders() {
  const reminderConfigs: { type: ReminderType; daysFrom: number; daysTo: number; subject: string }[] = [
    {
      type: '7_days_before',
      daysFrom: 6,
      daysTo: 7,
      subject: 'Tu membresía vence en 7 días',
    },
    {
      type: '3_days_before',
      daysFrom: 2,
      daysTo: 3,
      subject: 'Tu membresía vence en 3 días',
    },
    {
      type: 'expired',
      daysFrom: -1,
      daysTo: 0,
      subject: 'Tu membresía ha vencido',
    },
  ];

  for (const config of reminderConfigs) {
    await processReminderType(config.type, config.daysFrom, config.daysTo, config.subject);
  }
}

async function processReminderType(
  reminderType: ReminderType,
  daysFrom: number,
  daysTo: number,
  subject: string,
) {
  // Buscar membresías activas cuya fecha de vencimiento caiga en el rango,
  // que NO tengan ya un recordatorio de este tipo
  const memberships = await db
    .selectFrom('membership')
    .innerJoin('student', 'student.id', 'membership.student_id')
    .leftJoin('payment_reminder', (join) =>
      join
        .onRef('payment_reminder.membership_id', '=', 'membership.id')
        .on('payment_reminder.reminder_type', '=', reminderType),
    )
    .where('membership.status', '=', 'active')
    .where('membership.end_date', '>=', sql<Date>`CURRENT_DATE + make_interval(days => ${daysFrom})`)
    .where('membership.end_date', '<=', sql<Date>`CURRENT_DATE + make_interval(days => ${daysTo})`)
    .where('payment_reminder.id', 'is', null) // Sin recordatorio previo de este tipo
    .select([
      'membership.id as membership_id',
      'student.name as student_name',
      'student.email as student_email',
      'membership.end_date',
    ])
    .execute();

  console.log(`[CRON] ${reminderType}: ${memberships.length} membresías encontradas.`);

  for (const membership of memberships) {
    try {
      // Enviar email
      await sendEmail({
        to: membership.student_email,
        subject: `${subject} - Dance Academy`,
        html: buildReminderHtml(reminderType, membership.student_name, membership.end_date),
      });

      // Registrar recordatorio para no repetir
      await db
        .insertInto('payment_reminder')
        .values({
          membership_id: membership.membership_id,
          reminder_type: reminderType,
        })
        .execute();
    } catch (error) {
      console.error(
        `[CRON] Error enviando recordatorio ${reminderType} para membresía ${membership.membership_id}:`,
        error,
      );
    }
  }
}

function buildReminderHtml(type: ReminderType, studentName: string, endDate: Date): string {
  const formattedDate = new Date(endDate).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (type === 'expired') {
    return `
      <p>Hola ${studentName},</p>
      <p>Tu membresía ha <strong>vencido</strong> el <strong>${formattedDate}</strong>.</p>
      <p>Para seguir disfrutando de tus clases, por favor renueva tu membresía lo antes posible.</p>
      <p>¡Te esperamos en la academia!</p>
    `;
  }

  const days = type === '7_days_before' ? '7' : '3';
  return `
    <p>Hola ${studentName},</p>
    <p>Te recordamos que tu membresía vence en <strong>${days} días</strong> (el <strong>${formattedDate}</strong>).</p>
    <p>Para evitar interrupciones en tus clases, te recomendamos renovarla antes de la fecha de vencimiento.</p>
    <p>¡Gracias por ser parte de la academia!</p>
  `;
}
