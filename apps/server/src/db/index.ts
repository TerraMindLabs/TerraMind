import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { randomUUID, createHash } from 'crypto';
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

const activeDbPath = process.env.DB_PATH
  ? process.env.DB_PATH
  : fs.existsSync(targetDbPath)
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

  CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    transport TEXT NOT NULL,
    command TEXT,
    args TEXT,
    url TEXT,
    env TEXT,
    enabled INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    tools TEXT,
    last_checked DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function getUserByUsername(username: string): { id: string; username: string; password_hash: string } | undefined {
  const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
  return stmt.get(username) as any;
}

export function createUser(
  idOrUsername: string,
  usernameOrPasswordHash: string,
  passwordHash?: string,
  fullName: string = '',
  role: string = 'Cloud Architect'
): User {
  let id: string;
  let username: string;
  let hash: string;

  if (passwordHash === undefined) {
    id = randomUUID();
    username = idOrUsername;
    hash = usernameOrPasswordHash;
  } else {
    id = idOrUsername;
    username = usernameOrPasswordHash;
    hash = passwordHash;
  }

  try {
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, username, hash, fullName, role);
  } catch {
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)');
    stmt.run(id, username, hash);
  }
  logUserActivity(id, 'user_registered', { username, fullName, role });
  return { id, username, created_at: new Date().toISOString() };
}

export function verifyUser(username: string, rawPassword: string): { id: string; username: string } | null {
  const user = getUserByUsername(username);
  if (!user) return null;
  if (user.password_hash === hashPassword(rawPassword)) {
    return { id: user.id, username: user.username };
  }
  return null;
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

export function upsertMessage(id: string, conversationId: string, role: string, content: string, userId = ''): Message {
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET content = excluded.content
  `);
  stmt.run(id, conversationId, role, content);
  touchConversation(conversationId);

  const getStmt = db.prepare(`SELECT * FROM messages WHERE id = ?`);
  const msg = getStmt.get(id) as unknown as Message;
  if (msg) syncMongoMessage({ ...msg, user_id: userId });
  return msg;
}

export function addMessage(id: string, conversationId: string, role: string, content: string, userId = ''): Message {
  return upsertMessage(id, conversationId, role, content, userId);
}

// ---------------------------------------------------------------------
// Model Context Protocol (MCP) Server Management
// ---------------------------------------------------------------------

export interface McpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
}

export interface McpServer {
  id: string;
  name: string;
  description: string;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  status: 'active' | 'offline' | 'error';
  tools: McpTool[];
  last_checked?: string;
  created_at?: string;
  updated_at?: string;
}

function parseMcpRow(row: any): McpServer {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    transport: row.transport || 'stdio',
    command: row.command || '',
    args: row.args ? JSON.parse(row.args) : [],
    url: row.url || '',
    env: row.env ? JSON.parse(row.env) : {},
    enabled: Boolean(row.enabled),
    status: row.status || 'offline',
    tools: row.tools ? JSON.parse(row.tools) : [],
    last_checked: row.last_checked || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function getAllMcpServers(): McpServer[] {
  const stmt = db.prepare('SELECT * FROM mcp_servers ORDER BY created_at ASC');
  const rows = stmt.all() as any[];
  return rows.map(parseMcpRow);
}

export function getActiveMcpServers(): McpServer[] {
  const stmt = db.prepare("SELECT * FROM mcp_servers WHERE enabled = 1 AND status = 'active' ORDER BY created_at ASC");
  const rows = stmt.all() as any[];
  return rows.map(parseMcpRow);
}

export function getMcpServerById(id: string): McpServer | undefined {
  const stmt = db.prepare('SELECT * FROM mcp_servers WHERE id = ?');
  const row = stmt.get(id) as any;
  return row ? parseMcpRow(row) : undefined;
}

export function saveMcpServer(server: {
  id: string;
  name: string;
  description?: string;
  transport?: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled?: boolean;
  status?: 'active' | 'offline' | 'error';
  tools?: McpTool[];
}): McpServer {
  const existing = getMcpServerById(server.id);
  const transport = server.transport || existing?.transport || 'stdio';
  const desc = server.description !== undefined ? server.description : (existing?.description || '');
  const cmd = server.command !== undefined ? server.command : (existing?.command || '');
  const argsJson = JSON.stringify(server.args !== undefined ? server.args : (existing?.args || []));
  const url = server.url !== undefined ? server.url : (existing?.url || '');
  const envJson = JSON.stringify(server.env !== undefined ? server.env : (existing?.env || {}));
  const enabled = server.enabled !== undefined ? (server.enabled ? 1 : 0) : (existing ? (existing.enabled ? 1 : 0) : 1);
  const status = server.status || existing?.status || 'active';
  const toolsJson = JSON.stringify(server.tools !== undefined ? server.tools : (existing?.tools || []));
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO mcp_servers (id, name, description, transport, command, args, url, env, enabled, status, tools, last_checked, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      transport = excluded.transport,
      command = excluded.command,
      args = excluded.args,
      url = excluded.url,
      env = excluded.env,
      enabled = excluded.enabled,
      status = excluded.status,
      tools = excluded.tools,
      last_checked = excluded.last_checked,
      updated_at = excluded.updated_at
  `);
  stmt.run(server.id, server.name, desc, transport, cmd, argsJson, url, envJson, enabled, status, toolsJson, now, now);

  return getMcpServerById(server.id)!;
}

export function deleteMcpServer(id: string): boolean {
  const stmt = db.prepare('DELETE FROM mcp_servers WHERE id = ?');
  stmt.run(id);
  return true;
}

export function toggleMcpServer(id: string, enabled: boolean): McpServer | undefined {
  const stmt = db.prepare('UPDATE mcp_servers SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(enabled ? 1 : 0, id);
  return getMcpServerById(id);
}

export function updateMcpServerStatus(
  id: string,
  status: 'active' | 'offline' | 'error',
  tools?: McpTool[]
): McpServer | undefined {
  const now = new Date().toISOString();
  if (tools !== undefined) {
    const stmt = db.prepare(`
      UPDATE mcp_servers
      SET status = ?, tools = ?, last_checked = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, JSON.stringify(tools), now, id);
  } else {
    const stmt = db.prepare(`
      UPDATE mcp_servers
      SET status = ?, last_checked = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, now, id);
  }
  return getMcpServerById(id);
}

// Pre-seed default core DevOps MCP servers if table is empty
export function seedDefaultMcpServers(): void {
  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM mcp_servers');
    const res = countStmt.get() as { count: number };
    if (res && res.count === 0) {
      const defaults = [
        {
          id: 'terraform-registry',
          name: 'Terraform Registry MCP',
          description: 'Official HashiCorp Terraform Registry connector for provider schemas, verified community modules, and version compatibility.',
          transport: 'stdio',
          command: 'npx',
          args: JSON.stringify(['-y', 'terraform-mcp-server']),
          url: '',
          env: JSON.stringify({}),
          enabled: 1,
          status: 'active',
          tools: JSON.stringify([
            { name: 'search_modules', description: 'Search Terraform Registry for verified public and enterprise modules' },
            { name: 'get_provider_schema', description: 'Retrieve official HCL schema, arguments, and required attributes for cloud resource types' },
            { name: 'validate_version_constraints', description: 'Check version compatibility of providers and root modules' }
          ]),
          last_checked: new Date().toISOString()
        },
        {
          id: 'filesystem-workspace',
          name: 'Workspace Filesystem MCP',
          description: 'Secure local workspace file explorer and code inspector for TerraMind DevOps agents.',
          transport: 'stdio',
          command: 'npx',
          args: JSON.stringify(['-y', '@modelcontextprotocol/server-filesystem', './']),
          url: '',
          env: JSON.stringify({}),
          enabled: 1,
          status: 'active',
          tools: JSON.stringify([
            { name: 'read_workspace_file', description: 'Read and inspect file contents in local project workspaces' },
            { name: 'list_directory_tree', description: 'Browse directories and folder hierarchies safely' }
          ]),
          last_checked: new Date().toISOString()
        },
        {
          id: 'aws-cloud-control',
          name: 'AWS Cloud Architecture MCP',
          description: 'AWS Cloud Control API and Well-Architected Framework advisor for security, reliability, and cost.',
          transport: 'stdio',
          command: 'npx',
          args: JSON.stringify(['-y', '@modelcontextprotocol/server-aws']),
          url: '',
          env: JSON.stringify({}),
          enabled: 1,
          status: 'active',
          tools: JSON.stringify([
            { name: 'validate_iam_policy', description: 'Check IAM policies for wildcard permissions and least-privilege violations' },
            { name: 'estimate_resource_cost', description: 'Compute AWS pricing metrics for EC2, RDS, and EKS topologies' }
          ]),
          last_checked: new Date().toISOString()
        },
        {
          id: 'k8s-cluster-inspector',
          name: 'Kubernetes & Helm MCP',
          description: 'Kubernetes API schema validator and Helm chart linter for cloud-native deployments.',
          transport: 'stdio',
          command: 'npx',
          args: JSON.stringify(['-y', '@modelcontextprotocol/server-kubernetes']),
          url: '',
          env: JSON.stringify({}),
          enabled: 1,
          status: 'active',
          tools: JSON.stringify([
            { name: 'lint_k8s_manifest', description: 'Validate Kubernetes YAML against OpenAPI specs' },
            { name: 'inspect_helm_values', description: 'Check Helm chart values and default templating' }
          ]),
          last_checked: new Date().toISOString()
        }
      ];

      const insertStmt = db.prepare(`
        INSERT INTO mcp_servers (id, name, description, transport, command, args, url, env, enabled, status, tools, last_checked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const d of defaults) {
        insertStmt.run(d.id, d.name, d.description, d.transport, d.command, d.args, d.url, d.env, d.enabled, d.status, d.tools, d.last_checked);
      }
    }
  } catch (err) {
    console.warn('[DB] MCP seed warning:', err);
  }
}
seedDefaultMcpServers();

export { recordUserSession, logUserActivity };
export default db;
