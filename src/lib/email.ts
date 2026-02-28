import { Resend } from 'resend';
import { config } from './config';
import { withTimeout, withRetry } from './retry';
import { logger } from './logger';

/**
 * Instancia de Resend.
 * Solo se inicializa si RESEND_API_KEY está configurada.
 */
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM =
  process.env.EMAIL_FROM || 'Dance Academy <noreply@tudominio.com>';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
  contentId?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Envía un email usando Resend con timeout y retry.
 * En desarrollo sin API key, hace fallback a console.log.
 */
export async function sendEmail({ to, subject, html, attachments }: SendEmailParams) {
  if (!resend) {
    logger.debug({ to, subject }, '[DEV] Email simulate');
    return;
  }

  const sendFn = async () => {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      ...(attachments?.length && { attachments }),
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  };

  try {
    await withTimeout(
      withRetry(sendFn, {
        maxRetries: config.resend.maxRetries,
        delayMs: 1000,
        onRetry: (err, attempt) => {
          logger.warn({ err, attempt }, 'Retry sending email');
        },
      }),
      config.resend.timeout,
      'Email send timed out',
    );
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email after retries');
  }
}
