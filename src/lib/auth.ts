import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins/organization';
import { pool } from './db';
import { sendEmail } from './email';

export const auth = betterAuth({
  database: pool,

  // Autenticación por email y contraseña
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: 'Restablecer tu contraseña - Dance Academy',
        html: `<p>Hola ${user.name},</p>
               <p>Recibimos una solicitud para restablecer tu contraseña.</p>
               <p><a href="${url}">Haz clic aquí para restablecer tu contraseña</a></p>
               <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
               <p>Este enlace expira en 1 hora.</p>`,
      });
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hora
  },

  // Verificación de email
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: 'Verifica tu email - Dance Academy',
        html: `<p>Hola ${user.name},</p>
               <p>Gracias por registrarte. Por favor verifica tu email:</p>
               <p><a href="${url}">Verificar mi email</a></p>`,
      });
    },
    sendOnSignUp: true,
  },

  // Configuración de sesiones
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Refresca la sesión cada 1 día
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache de 5 minutos
    },
  },

  // Proveedores sociales
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },

  // Rate limiting para prevenir fuerza bruta
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },

  // Orígenes de confianza (configurable vía env)
  trustedOrigins: process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'],

  // Plugins
  plugins: [
    // Multi-tenancy: cada academia es una "organization"
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 200,
      creatorRole: 'owner',
    }),
  ],
});
