import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import {
  initMongo,
  recordUserSession,
  logUserActivity,
  syncMongoConversation,
  syncMongoMessage,
  deleteMongoConversation
} from './mongo';

// Initialize MongoDB in the background
initMongo().catch((err) => console.warn('[MongoDB] Init error:', err.message));

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

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📁',
    user_id TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    provider TEXT,
    model TEXT,
    project_id TEXT DEFAULT '',
    user_id TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Migrations for existing tables
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN project_id TEXT DEFAULT '';`);
} catch {}

try {
  db.exec(`ALTER TABLE conversations ADD COLUMN user_id TEXT DEFAULT '';`);
} catch {}

try {
  db.exec(`ALTER TABLE conversations ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;`);
} catch {}

try {
  db.exec(`ALTER TABLE projects ADD COLUMN user_id TEXT DEFAULT '';`);
} catch {}

// Requirement 3: Clean up any seeded default projects
try {
  db.exec(`DELETE FROM projects WHERE id IN ('proj-aws', 'proj-k8s', 'proj-finops', 'proj-cicd');`);
} catch {}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  user_id?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  project_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
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
  logUserActivity(id, 'user_registered', { username });
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

// Project Helpers (Requirement 3: No pre-existing projects seeded)
export function getProjects(userId?: string): Project[] {
  if (userId) {
    const stmt = db.prepare('SELECT * FROM projects WHERE user_id = ? OR user_id = "" ORDER BY created_at ASC');
    return stmt.all(userId) as unknown as Project[];
  }
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at ASC');
  return stmt.all() as unknown as Project[];
}

export function createProject(id: string, name: string, description: string, icon = '📁', userId = ''): Project {
  const stmt = db.prepare('INSERT INTO projects (id, name, description, icon, user_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, name, description, icon, userId);
  if (userId) {
    logUserActivity(userId, 'project_created', { id, name });
  }
  const getStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return getStmt.get(id) as unknown as Project;
}

export function deleteProject(id: string, userId?: string): void {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
  if (userId) {
    logUserActivity(userId, 'project_deleted', { id });
  }
}

// Conversation Helpers (Requirement 4: Persists all history properly)
export function createConversation(
  id: string,
  title: string,
  provider: string,
  model: string,
  projectId = '',
  userId = ''
): Conversation {
  const stmt = db.prepare(`
    INSERT INTO conversations (id, title, provider, model, project_id, user_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(id, title, provider, model, projectId, userId);

  const convo = getConversation(id)!;
  syncMongoConversation(convo);
  if (userId) {
    logUserActivity(userId, 'conversation_started', { id, title });
  }
  return convo;
}

export function getConversations(userId?: string, projectId?: string): Conversation[] {
  if (userId && projectId) {
    const stmt = db.prepare(`
      SELECT * FROM conversations 
      WHERE (user_id = ? OR user_id = '') AND project_id = ? 
      ORDER BY updated_at DESC, created_at DESC
    `);
    return stmt.all(userId, projectId) as unknown as Conversation[];
  }
  if (userId) {
    const stmt = db.prepare(`
      SELECT * FROM conversations 
      WHERE user_id = ? OR user_id = '' 
      ORDER BY updated_at DESC, created_at DESC
    `);
    return stmt.all(userId) as unknown as Conversation[];
  }
  if (projectId) {
    const stmt = db.prepare(`
      SELECT * FROM conversations 
      WHERE project_id = ? 
      ORDER BY updated_at DESC, created_at DESC
    `);
    return stmt.all(projectId) as unknown as Conversation[];
  }
  const stmt = db.prepare(`
    SELECT * FROM conversations 
    ORDER BY updated_at DESC, created_at DESC
  `);
  return stmt.all() as unknown as Conversation[];
}

export function getConversation(id: string): Conversation | undefined {
  const stmt = db.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `);
  return stmt.get(id) as unknown as Conversation | undefined;
}

export function touchConversation(id: string, title?: string): void {
  if (title) {
    const stmt = db.prepare(`
      UPDATE conversations SET updated_at = CURRENT_TIMESTAMP, title = ? WHERE id = ?
    `);
    stmt.run(title, id);
  } else {
    const stmt = db.prepare(`
      UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(id);
  }
  const convo = getConversation(id);
  if (convo) syncMongoConversation(convo);
}

export function updateConversationTitle(id: string, title: string): void {
  const stmt = db.prepare(`
    UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(title, id);
  const convo = getConversation(id);
  if (convo) syncMongoConversation(convo);
}

export function deleteConversation(id: string, userId?: string): void {
  const deleteMsgs = db.prepare(`DELETE FROM messages WHERE conversation_id = ?`);
  deleteMsgs.run(id);
  const deleteConvo = db.prepare(`DELETE FROM conversations WHERE id = ?`);
  deleteConvo.run(id);
  deleteMongoConversation(id);
  if (userId) {
    logUserActivity(userId, 'conversation_deleted', { id });
  }
}

export function getMessages(conversationId: string): Message[] {
  const stmt = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `);
  return stmt.all(conversationId) as unknown as Message[];
}

export function addMessage(id: string, conversationId: string, role: string, content: string, userId = ''): Message {
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, conversationId, role, content);
  touchConversation(conversationId);

  const getStmt = db.prepare(`SELECT * FROM messages WHERE id = ?`);
  const msg = getStmt.get(id) as unknown as Message;
  syncMongoMessage({ ...msg, user_id: userId });
  return msg;
}

export { recordUserSession, logUserActivity };
export default db;
