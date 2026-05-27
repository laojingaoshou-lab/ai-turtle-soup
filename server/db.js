import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'haigui.db');

let db = null;

export function getDatabase() {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_records (
      id             TEXT PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      script_id      TEXT NOT NULL,
      script_title   TEXT NOT NULL,
      status         TEXT NOT NULL,
      question_count INTEGER NOT NULL DEFAULT 0,
      started_at     INTEGER NOT NULL,
      ended_at       INTEGER,
      result         TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON game_records(user_id);

    CREATE TABLE IF NOT EXISTS custom_scripts (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      scenario    TEXT NOT NULL,
      truth       TEXT NOT NULL,
      hints       TEXT NOT NULL DEFAULT '[]',
      difficulty  TEXT NOT NULL DEFAULT 'medium',
      category    TEXT,
      created_at  INTEGER NOT NULL,
      play_count  INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_custom_scripts_user_id ON custom_scripts(user_id);
  `);

  // Migration: add token_version column for existing databases
  try {
    db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1');
  } catch {
    // Column already exists — fine
  }

  return db;
}

// --- User CRUD ---

export function createUser(username, hash) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const result = stmt.run(username, hash);
  return { id: result.lastInsertRowid, username, token_version: 1 };
}

export function getUserByUsername(username) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null;
}

export function getUserById(id) {
  const db = getDatabase();
  return db.prepare('SELECT id, username, token_version, created_at FROM users WHERE id = ?').get(id) || null;
}

export function incrementTokenVersion(userId) {
  const db = getDatabase();
  const result = db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(userId);
  return result.changes > 0;
}

// --- Game Records ---

export function saveGameRecord(userId, record) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO game_records (id, user_id, script_id, script_title, status, question_count, started_at, ended_at, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    record.id, userId, record.scriptId, record.scriptTitle,
    record.status, record.questionCount, record.startedAt,
    record.endedAt || null, record.result || null
  );
}

export function saveGameRecordsBatch(userId, records) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO game_records (id, user_id, script_id, script_title, status, question_count, started_at, ended_at, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((recs) => {
    let count = 0;
    for (const r of recs) {
      const result = stmt.run(
        r.id, userId, r.scriptId, r.scriptTitle,
        r.status, r.questionCount, r.startedAt,
        r.endedAt || null, r.result || null
      );
      if (result.changes > 0) count++;
    }
    return count;
  });
  return tx(records);
}

export function getGameRecords(userId) {
  const db = getDatabase();
  return db.prepare(
    'SELECT id, script_id AS scriptId, script_title AS scriptTitle, status, question_count AS questionCount, started_at AS startedAt, ended_at AS endedAt, result FROM game_records WHERE user_id = ? ORDER BY started_at DESC'
  ).all(userId);
}

// --- Custom Scripts ---

export function saveCustomScript(userId, script) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO custom_scripts (id, user_id, title, scenario, truth, hints, difficulty, category, created_at, play_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    script.id, userId, script.title, script.scenario, script.truth,
    JSON.stringify(script.hints || []),
    script.difficulty || 'medium', script.category || null,
    script.createdAt || Date.now(), script.playCount || 0
  );
}

export function saveCustomScriptsBatch(userId, scripts) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO custom_scripts (id, user_id, title, scenario, truth, hints, difficulty, category, created_at, play_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((scrs) => {
    let count = 0;
    for (const s of scrs) {
      const result = stmt.run(
        s.id, userId, s.title, s.scenario, s.truth,
        JSON.stringify(s.hints || []),
        s.difficulty || 'medium', s.category || null,
        s.createdAt || Date.now(), s.playCount || 0
      );
      if (result.changes > 0) count++;
    }
    return count;
  });
  return tx(scripts);
}

export function getCustomScripts(userId) {
  const db = getDatabase();
  const rows = db.prepare(
    'SELECT * FROM custom_scripts WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);
  return rows.map(row => ({
    ...row,
    source: 'custom',
    hints: JSON.parse(row.hints || '[]'),
    createdAt: row.created_at,
    playCount: row.play_count,
  }));
}

export function updateCustomScript(userId, scriptId, fields) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM custom_scripts WHERE id = ? AND user_id = ?').get(scriptId, userId);
  if (!existing) return false;

  const updates = [];
  const params = [];
  for (const [key, value] of Object.entries(fields)) {
    const col = key === 'createdAt' ? 'created_at' : key === 'playCount' ? 'play_count' : key;
    if (col === 'id' || col === 'user_id') continue;
    if (col === 'hints') {
      updates.push('hints = ?');
      params.push(JSON.stringify(value || []));
    } else {
      updates.push(`${col} = ?`);
      params.push(value);
    }
  }
  if (updates.length === 0) return true;
  params.push(scriptId, userId);
  db.prepare(`UPDATE custom_scripts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
  return true;
}

export function deleteCustomScript(userId, scriptId) {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM custom_scripts WHERE id = ? AND user_id = ?').run(scriptId, userId);
  return result.changes > 0;
}
