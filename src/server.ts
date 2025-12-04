import buildApp from './app';
import dotenv from 'dotenv';

dotenv.config();

const app = buildApp();
const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    // En Fastify, host '0.0.0.0' es necesario para Docker/Deployments
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();