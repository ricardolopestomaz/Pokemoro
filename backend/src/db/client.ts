import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import fs from 'fs';

let sqliteDb: Database.Database | null = null;
let drizzleDb: BetterSQLite3Database<typeof schema> | null = null;

export function getDatabase(customPath?: string): BetterSQLite3Database<typeof schema> {
  if (drizzleDb) {
    return drizzleDb;
  }

  const defaultDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }

  const dbFilePath = customPath || path.join(defaultDir, 'pokemoro.sqlite');
  sqliteDb = new Database(dbFilePath, { timeout: 7000 });

  // Ativa Foreign Keys e WAL mode para alta performance e segurança concorrente
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  // Inicializa tabelas essenciais se ainda não existirem
  runBootstrapMigrations(sqliteDb);

  drizzleDb = drizzle(sqliteDb, { schema });
  return drizzleDb;
}

export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    drizzleDb = null;
  }
}

function runBootstrapMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      streak_days INTEGER DEFAULT 0 NOT NULL,
      last_study_date TEXT,
      focus_coins INTEGER DEFAULT 0 NOT NULL,
      active_environment TEXT DEFAULT 'greengrass' NOT NULL,
      has_completed_onboarding INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventories (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      biscuits_basic INTEGER DEFAULT 0 NOT NULL,
      biscuits_great INTEGER DEFAULT 0 NOT NULL,
      biscuits_master INTEGER DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#4CAF50' NOT NULL,
      icon TEXT DEFAULT 'book' NOT NULL,
      total_minutes INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      mode TEXT NOT NULL,
      target_duration_minutes INTEGER NOT NULL,
      actual_duration_minutes INTEGER NOT NULL,
      time_spent_out_of_app_seconds INTEGER DEFAULT 0 NOT NULL,
      is_deep_focus INTEGER DEFAULT 1 NOT NULL,
      deep_focus_multiplier REAL DEFAULT 1.2 NOT NULL,
      streak_multiplier REAL DEFAULT 1.0 NOT NULL,
      focus_power_earned INTEGER DEFAULT 0 NOT NULL,
      focus_coins_earned INTEGER DEFAULT 0 NOT NULL,
      interrupted_early INTEGER DEFAULT 0 NOT NULL,
      is_coffee_break_unlocked INTEGER DEFAULT 1 NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_pokemon (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pokemon_id INTEGER NOT NULL,
      nickname TEXT NOT NULL,
      variant TEXT DEFAULT 'regular' NOT NULL,
      friendship_level INTEGER DEFAULT 1 NOT NULL,
      is_in_active_team INTEGER DEFAULT 0 NOT NULL,
      team_slot INTEGER,
      role TEXT DEFAULT 'ENERGY' NOT NULL,
      passive_bonus_description TEXT,
      recruited_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pokemon_friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pokemon_id INTEGER NOT NULL,
      current_points INTEGER DEFAULT 0 NOT NULL,
      max_points INTEGER DEFAULT 5 NOT NULL,
      is_recruited INTEGER DEFAULT 0 NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS focus_dex_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pokemon_id INTEGER NOT NULL,
      sleep_style INTEGER NOT NULL,
      is_shiny INTEGER DEFAULT 0 NOT NULL,
      photo_data_url TEXT,
      discovered_at TEXT NOT NULL
    );
  `);

  try {
    db.exec(`ALTER TABLE focus_dex_entries ADD COLUMN photo_data_url TEXT;`);
  } catch {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN has_completed_onboarding INTEGER DEFAULT 0 NOT NULL;`);
  } catch {}
}

