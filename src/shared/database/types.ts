import { Generated, ColumnType } from "kysely";

export interface AuthTable {
    id: string;
    email: string;
    password_hash: string;
    // SQLite almacena booleanos como 0 o 1
    // ColumnType permite definir tipos diferentes para select/insert/update
    active: ColumnType<boolean, number, number>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}

export interface RefreshTokenTable {
    id: string;
    user_id: string;
    valid: number;
    expires_at: ColumnType<Date, string, string>;
    created_at: ColumnType<Date, string, string>;
}

export interface Database {
    auth: AuthTable;
    refresh_token: RefreshTokenTable;
}