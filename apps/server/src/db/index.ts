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

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📁',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    provider TEXT,
    model TEXT,
    project_id TEXT DEFAULT 'proj-aws',
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

// Ensure project_id column exists if table existed previously without it
try {
  db.exec(`ALTER TABLE conversations ADD COLUMN project_id TEXT DEFAULT 'proj-aws';`);
} catch {
  // Column already exists
}

// Seed default projects if none exist
const projectCountStmt = db.prepare('SELECT COUNT(*) as count FROM projects');
const countRow = projectCountStmt.get() as { count: number };
if (!countRow || countRow.count === 0) {
  const insertProj = db.prepare(`INSERT INTO projects (id, name, description, icon) VALUES (?, ?, ?, ?)`);
  insertProj.run('proj-aws', 'AWS Production Cloud', 'VPC, EKS, RDS, S3 multi-region setup', '☁️');
  insertProj.run('proj-k8s', 'Kubernetes Platform', 'GitOps, ArgoCD, Ingress & microservices', '☸️');
  insertProj.run('proj-finops', 'FinOps Cost Optimizer', 'Multi-cloud pricing, Spot & Graviton audit', '💰');
  insertProj.run('proj-cicd', 'CI/CD & DevSecOps', 'GitHub Actions, OIDC keyless & tfsec', '🔄');
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  project_id?: string;
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

// Project Helpers
export function getProjects(): Project[] {
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at ASC');
  return stmt.all() as unknown as Project[];
}

export function createProject(id: string, name: string, description: string, icon = '📁'): Project {
  const stmt = db.prepare('INSERT INTO projects (id, name, description, icon) VALUES (?, ?, ?, ?)');
  stmt.run(id, name, description, icon);
  const getStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return getStmt.get(id) as unknown as Project;
}

export function deleteProject(id: string): void {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
}

// Conversation Helpers
export function createConversation(id: string, title: string, provider: string, model: string, projectId = 'proj-aws'): Conversation {
  const stmt = db.prepare(`
    INSERT INTO conversations (id, title, provider, model, project_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, title, provider, model, projectId);
  return getConversation(id)!;
}

export function getConversations(projectId?: string): Conversation[] {
  if (projectId) {
    const stmt = db.prepare(`
      SELECT * FROM conversations WHERE project_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(projectId) as unknown as Conversation[];
  }
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
