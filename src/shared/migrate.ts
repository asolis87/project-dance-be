import 'dotenv/config';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Kysely, Migrator, PostgresDialect } from 'kysely';
import type { Migration, MigrationProvider } from 'kysely';
import { Pool } from 'pg';

class ESMFileMigrationProvider implements MigrationProvider {
  private migrationFolder: string;

  constructor(migrationFolder: string) {
    this.migrationFolder = migrationFolder;
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};
    const files = await fs.readdir(this.migrationFolder);

    for (const fileName of files) {
      if (!fileName.endsWith('.js') && !fileName.endsWith('.ts')) continue;

      const filePath = path.join(this.migrationFolder, fileName);
      const migration = await import(filePath);

      const migrationKey = fileName.replace(/\.(js|ts)$/, '');
      migrations[migrationKey] = migration;
    }

    return migrations;
  }
}

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
    provider: new ESMFileMigrationProvider(
      path.join(__dirname, 'database', 'migrations'),
    ),
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
