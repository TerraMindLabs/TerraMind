import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  initMongo,
  recordUserSession,
  logUserActivity,
  syncMongoConversation,
  syncMongoMessage,
  deleteMongoConversation
} from './mongo';

import fs from 'fs';

// Initialize MongoDB in the background
initMongo().catch((err) => console.warn('[MongoDB] Init error:', err.message));

// Protect database file in a dedicated data directory
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.warn('[DB] Failed to create data directory:', err);
  }
}

const legacyDbPath = path.join(process.cwd(), 'terramind.db');
const targetDbPath = process.env.DB_PATH || path.join(dataDir, 'terramind.db');

// Migrate legacy root database into data/ if it exists
if (!process.env.DB_PATH && fs.existsSync(legacyDbPath) && !fs.existsSync(targetDbPath)) {
  try {
    fs.renameSync(legacyDbPath, targetDbPath);
    if (fs.existsSync(legacyDbPath + '-wal')) fs.renameSync(legacyDbPath + '-wal', targetDbPath + '-wal');
    if (fs.existsSync(legacyDbPath + '-shm')) fs.renameSync(legacyDbPath + '-shm', targetDbPath + '-shm');
  } catch {
    // Fallback if cross-device rename is not permitted
  }
}

const activeDbPath = fs.existsSync(targetDbPath)
  ? targetDbPath
  : fs.existsSync(legacyDbPath)
  ? legacyDbPath
  : targetDbPath;

const db = new DatabaseSync(activeDbPath);

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

  CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    role TEXT DEFAULT 'editor',
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    provider TEXT,
    model TEXT,
    project_id TEXT DEFAULT '',
    user_id TEXT DEFAULT '',
    agent_id TEXT DEFAULT 'agent_tf-devops-expert',
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
  db.exec(`ALTER TABLE conversations ADD COLUMN agent_id TEXT DEFAULT 'agent_tf-devops-expert';`);
} catch {}

try {
  db.exec(`ALTER TABLE conversations ADD COLUMN updated_at DATETIME;`);
  db.exec(`UPDATE conversations SET updated_at = created_at WHERE updated_at IS NULL;`);
} catch {}

try {
  db.exec(`ALTER TABLE projects ADD COLUMN user_id TEXT DEFAULT '';`);
} catch {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT '';`);
} catch {}

try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Cloud Architect';`);
} catch {}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT DEFAULT 'editor',
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id)
    );
  `);
} catch {}

// Clean up any seeded default projects
try {
  db.exec(`DELETE FROM projects WHERE id IN ('proj-aws', 'proj-k8s', 'proj-finops', 'proj-cicd');`);
} catch {}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  role: 'owner' | 'editor' | 'viewer';
  added_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  user_id?: string;
  created_at: string;
  is_shared?: boolean;
  member_role?: string;
  owner_name?: string;
}

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  project_id?: string;
  user_id?: string;
  agent_id?: string;
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

export function createUser(id: string, username: string, passwordHash: string, fullName: string = '', role: string = 'Cloud Architect'): User {
  try {
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, username, passwordHash, fullName, role);
  } catch {
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)');
    stmt.run(id, username, passwordHash);
  }
  logUserActivity(id, 'user_registered', { username, fullName, role });
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

// Project Helpers (Requirement 3 & Workspace Sharing)
export function getProjectById(id: string): Project | undefined {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id) as unknown as Project;
}

export function getProjects(userId?: string): Project[] {
  if (userId) {
    const stmt = db.prepare(`
      SELECT p.*,
        CASE WHEN p.user_id = ? THEN 'owner' ELSE COALESCE(pm.role, 'editor') END as member_role,
        CASE WHEN p.user_id != ? AND pm.user_id = ? THEN 1 ELSE 0 END as is_shared,
        COALESCE(u.username, 'Owner') as owner_name
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? OR p.user_id = '' OR pm.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `);
    const rows = stmt.all(userId, userId, userId, userId, userId, userId) as any[];
    return rows.map((r) => ({
      ...r,
      is_shared: Boolean(r.is_shared)
    }));
  }
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at ASC');
  return stmt.all() as unknown as Project[];
}

export function createProject(id: string, name: string, description: string, icon = '📁', userId = ''): Project {
  const stmt = db.prepare('INSERT INTO projects (id, name, description, icon, user_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, name, description, icon, userId);
  if (userId) {
    logUserActivity(userId, 'project_created', { id, name });
    // Also record owner in project_members
    try {
      const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
      const username = user?.username || 'Owner';
      const pmStmt = db.prepare('INSERT INTO project_members (id, project_id, user_id, username, role) VALUES (?, ?, ?, ?, ?)');
      pmStmt.run('pm-' + randomUUID(), id, userId, username, 'owner');
    } catch {}
  }
  const getStmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return getStmt.get(id) as unknown as Project;
}

export function deleteProject(id: string, userId?: string): void {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
  try {
    db.prepare('DELETE FROM project_members WHERE project_id = ?').run(id);
  } catch {}
  if (userId) {
    logUserActivity(userId, 'project_deleted', { id });
  }
}

export function getProjectMembers(projectId: string): ProjectMember[] {
  const stmt = db.prepare('SELECT * FROM project_members WHERE project_id = ? ORDER BY added_at ASC');
  return stmt.all(projectId) as any[];
}

export function addProjectMember(projectId: string, targetUsername: string, role = 'editor'): ProjectMember {
  const user = getUserByUsername(targetUsername);
  const targetUserId = user ? user.id : 'user-' + randomUUID();
  const id = 'pm-' + randomUUID();

  const stmt = db.prepare(`
    INSERT INTO project_members (id, project_id, user_id, username, role, added_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(project_id, user_id) DO UPDATE SET role = excluded.role
  `);
  stmt.run(id, projectId, targetUserId, targetUsername, role);

  const getStmt = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?');
  return getStmt.get(projectId, targetUserId) as any;
}

export function removeProjectMember(projectId: string, memberId: string): void {
  const stmt = db.prepare('DELETE FROM project_members WHERE project_id = ? AND (id = ? OR user_id = ?)');
  stmt.run(projectId, memberId, memberId);
}

export function createConversation(
  id: string,
  title: string,
  provider: string,
  model: string,
  projectId = '',
  userId = '',
  agentId = 'agent_tf-devops-expert'
): Conversation {
  const stmt = db.prepare(`
    INSERT INTO conversations (id, title, provider, model, project_id, user_id, agent_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(id, title, provider, model, projectId, userId, agentId);

  const convo = getConversation(id)!;
  syncMongoConversation(convo);
  if (userId) {
    logUserActivity(userId, 'conversation_started', { id, title, agentId });
  }
  return convo;
}

export function updateConversationAgent(id: string, agentId: string): void {
  try {
    const stmt = db.prepare(`UPDATE conversations SET agent_id = ? WHERE id = ?`);
    stmt.run(agentId, id);
  } catch {}
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
