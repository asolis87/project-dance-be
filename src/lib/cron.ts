import cron from 'node-cron';
import { processPaymentReminders } from '../modules/payments/payments.cron';

/**
 * Inicializa todos los cron jobs de la aplicación.
 * Debe llamarse después de que la app esté lista.
 */
export function initCronJobs() {
  // Recordatorios de pago - cada día a las 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Ejecutando recordatorios de pago...');
    try {
      await processPaymentReminders();
      console.log('[CRON] Recordatorios de pago procesados correctamente.');
    } catch (error) {
      console.error('[CRON] Error procesando recordatorios de pago:', error);
    }
  });

  console.log('[CRON] Jobs inicializados.');
}
