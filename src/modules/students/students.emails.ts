import { sendEmail } from '../../lib/email';

interface StudentEmailData {
  name: string;
  email: string;
  affiliation_number: string;
  qr_code: string | null;
}

/**
 * Construye el HTML del email de bienvenida para un nuevo alumno.
 */
function buildWelcomeEmailHtml(student: StudentEmailData): string {
  const qrSection = student.qr_code
    ? `
      <div style="text-align: center; margin: 24px 0;">
        <p style="color: #555; font-size: 14px; margin-bottom: 8px;">Tu código QR de acceso:</p>
        <img src="cid:student-qr" alt="Código QR" width="200" height="200" style="border: 1px solid #e0e0e0; border-radius: 8px;" />
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #7c3aed; padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">¡Bienvenido/a!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="color: #333; font-size: 16px; margin: 0 0 16px;">
                Hola <strong>${student.name}</strong>,
              </p>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Tu registro como alumno ha sido completado exitosamente. A continuación encontrarás tus datos de acceso.
              </p>

              <!-- Info card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px;">Número de afiliación</p>
                    <p style="color: #7c3aed; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 1px;">${student.affiliation_number}</p>
                  </td>
                </tr>
              </table>

              ${qrSection}

              <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0; text-align: center;">
                Presenta tu código QR o número de afiliación al momento de registrar tu asistencia.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="color: #aaa; font-size: 12px; margin: 0;">
                Este es un correo automático, por favor no responder.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Extrae el Buffer PNG de un Data URL base64.
 */
function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64Data = dataUrl.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}

/**
 * Envía el email de bienvenida a un nuevo alumno.
 * Incluye el QR como imagen inline si está disponible.
 */
export async function sendStudentWelcomeEmail(student: StudentEmailData): Promise<void> {
  const html = buildWelcomeEmailHtml(student);

  const attachments =
    student.qr_code
      ? [
          {
            filename: 'qr-code.png',
            content: dataUrlToBuffer(student.qr_code),
            contentType: 'image/png',
            contentId: 'student-qr',
          },
        ]
      : undefined;

  await sendEmail({
    to: student.email,
    subject: '¡Bienvenido/a! Tu registro ha sido completado',
    html,
    attachments,
  });
}
