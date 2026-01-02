import Database from "better-sqlite3";

export const db = new Database("data.sqlite");

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      platform TEXT,
      direction TEXT,
      text TEXT,
      intent TEXT,
      ai_response TEXT,
      status TEXT NOT NULL DEFAULT 'unprocessed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      raw_json TEXT
    );
  `);
}
