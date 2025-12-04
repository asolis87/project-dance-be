import * as path from 'path';
import { promises as fs } from 'fs';
import { Migrator, FileMigrationProvider } from 'kysely';
import { db } from './shared/database/db';

async function migrate() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // Apunta a la carpeta donde pusimos la migración
      migrationFolder: path.join(__dirname, 'shared/database/migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migración "${it.migrationName}" ejecutada correctamente`);
    } else if (it.status === 'Error') {
      console.error(`error en migración "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('Error al migrar:', error);
    process.exit(1);
  }

  await db.destroy();
}

migrate();