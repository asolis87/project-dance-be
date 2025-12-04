import { Kysely, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';
import { Database } from './types';

const dialect = new SqliteDialect({
    database: new SQLite('project_name.db')
});

export const db = new Kysely<Database>({
    dialect
});