export const config = {
  stripe: {
    timeout: Number(process.env.STRIPE_TIMEOUT) || 30000,
    maxRetries: Number(process.env.STRIPE_MAX_RETRIES) || 3,
  },
  resend: {
    timeout: Number(process.env.RESEND_TIMEOUT) || 10000,
    maxRetries: Number(process.env.RESEND_MAX_RETRIES) || 3,
  },
  db: {
    timeout: Number(process.env.DB_TIMEOUT) || 10000,
    maxRetries: Number(process.env.DB_MAX_RETRIES) || 3,
  },
} as const;

export type Config = typeof config;
