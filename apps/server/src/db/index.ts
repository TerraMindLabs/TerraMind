import { DatabaseSync } from 'node:sqlite';
import path from 'path';

// Stores DB in the server directory
const db = new DatabaseSync(path.join(process.cwd(), 'terramind.db'));

// Write-Ahead Logging for high performance
db.exec('PRAGMA journal_mode = WAL;');

// Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    provider TEXT,
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  );
`);

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  created_at: string;
}

// User Authentication Helpers
export function getUserByUsername(username: string): { id: string; username: string; password_hash: string } | undefined {
  const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
  return stmt.get(username) as any;
}

export function createUser(id: string, username: string, passwordHash: string): User {
  const stmt = db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)');
  stmt.run(id, username, passwordHash);
  return { id, username, created_at: new Date().toISOString() };
}

export function getUserCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const res = stmt.get() as { count: number };
  return res ? res.count : 0;
}

// Settings Helpers (API Keys & Preferences)
export function getSetting(key: string): string | undefined {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  return row ? row.value : undefined;
}

export function getAllSettings(): Record<string, string> {
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all() as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

export function setSetting(key: string, value: string): void {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key, value);
}

// Conversation Helpers
export function createConversation(id: string, title: string, provider: string, model: string): Conversation {
  const stmt = db.prepare(`
    INSERT INTO conversations (id, title, provider, model)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, title, provider, model);
  return getConversation(id)!;
}

export function getConversations(): Conversation[] {
  const stmt = db.prepare(`
    SELECT * FROM conversations ORDER BY created_at DESC
  `);
  return stmt.all() as unknown as Conversation[];
}

export function getConversation(id: string): Conversation | undefined {
  const stmt = db.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `);
  return stmt.get(id) as unknown as Conversation | undefined;
}

export function updateConversationTitle(id: string, title: string): void {
  const stmt = db.prepare(`
    UPDATE conversations SET title = ? WHERE id = ?
  `);
  stmt.run(title, id);
}

export function deleteConversation(id: string): void {
  const deleteMsgs = db.prepare(`DELETE FROM messages WHERE conversation_id = ?`);
  deleteMsgs.run(id);
  const deleteConvo = db.prepare(`DELETE FROM conversations WHERE id = ?`);
  deleteConvo.run(id);
}

export function getMessages(conversationId: string): Message[] {
  const stmt = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `);
  return stmt.all(conversationId) as unknown as Message[];
}

export function addMessage(id: string, conversationId: string, role: string, content: string): Message {
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, conversationId, role, content);
  const getStmt = db.prepare(`SELECT * FROM messages WHERE id = ?`);
  return getStmt.get(id) as unknown as Message;
}

export default db;
