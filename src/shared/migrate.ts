import 'dotenv/config';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Kysely, Migrator, FileMigrationProvider, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

async function runMigrations() {
  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'database', 'migrations'),
    }),
  });

  console.log('Ejecutando migraciones custom...');

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`  ✓ ${it.migrationName}`);
    } else if (it.status === 'Error') {
      console.error(`  ✗ ${it.migrationName}`);
    }
  });

  if (error) {
    console.error('Error ejecutando migraciones:', error);
    process.exit(1);
  }

  if (!results?.length) {
    console.log('  No hay migraciones pendientes.');
  }

  console.log('Migraciones completadas.');
  await db.destroy();
}

runMigrations();
