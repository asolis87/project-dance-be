import { Resend } from 'resend';

/**
 * Instancia de Resend.
 * Solo se inicializa si RESEND_API_KEY está configurada.
 */
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Dance Academy <noreply@tudominio.com>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envía un email usando Resend.
 * En desarrollo sin API key, hace fallback a console.log.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.log(`[DEV] Email para ${to}`);
    console.log(`  Asunto: ${subject}`);
    console.log(`  Contenido: ${html}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[EMAIL] Error al enviar email:', error);
    }
  } catch (err) {
    console.error('[EMAIL] Error inesperado al enviar email:', err);
  }
}
