import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from '../shared/database/types';

/**
 * Pool de conexiones PostgreSQL compartido.
 * Usado tanto por Kysely (custom queries) como por Better Auth (via auth.ts).
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Instancia de Kysely con PostgresDialect.
 * Usar para todas las queries de negocio (instructores, alumnos, grupos, etc.).
 */
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
