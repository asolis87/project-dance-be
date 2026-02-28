import 'dotenv/config';

import buildApp from './app';
import { db, pool } from './lib/db';

const app = buildApp();
const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  console.log(`\n${signal} recibido, cerrando servidor...`);

  try {
    await app.close();
    await db.destroy();
    await pool.end();
    console.log('Conexiones cerradas correctamente');
    process.exit(0);
  } catch (err) {
    console.error('Error durante el shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

start();
