var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/services/ollama.ts
var ollama_exports = {};
__export(ollama_exports, {
  isOllamaRunning: () => isOllamaRunning,
  startOllamaDaemon: () => startOllamaDaemon
});
async function isOllamaRunning() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch("http://127.0.0.1:11434/api/version", { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
function startOllamaDaemon() {
  return new Promise((resolve) => {
    try {
      const child = (0, import_child_process2.spawn)("ollama", ["serve"], {
        detached: true,
        stdio: "ignore",
        shell: true
      });
      child.unref();
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const running = await isOllamaRunning();
        if (running || attempts >= 10) {
          clearInterval(interval);
          resolve(running);
        }
      }, 500);
    } catch {
      resolve(false);
    }
  });
}
var import_child_process2;
var init_ollama = __esm({
  "src/services/ollama.ts"() {
    import_child_process2 = require("child_process");
  }
});

// src/server.ts
var import_fastify = __toESM(require("fastify"));
var import_static = __toESM(require("@fastify/static"));
var import_path3 = __toESM(require("path"));
var import_fs = __toESM(require("fs"));

// src/routes/chat.ts
var import_crypto2 = require("crypto");

// src/db/index.ts
var import_node_sqlite = require("node:sqlite");
var import_path = __toESM(require("path"));
var import_crypto = require("crypto");

// src/db/mongo.ts
var import_mongodb = require("mongodb");
var MONGO_URI = process.env.MONGO_URI || "";
var client = null;
var db = null;
var isConnected = false;
async function initMongo() {
  if (!MONGO_URI) return false;
  if (isConnected && db) return true;
  try {
    client = new import_mongodb.MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 3e3
    });
    await client.connect();
    db = client.db();
    isConnected = true;
    console.log("[MongoDB] Connected to database at", MONGO_URI);
    try {
      await db.collection("conversations").createIndex({ user_id: 1, created_at: -1 });
      await db.collection("conversations").createIndex({ id: 1 }, { sparse: true });
      await db.collection("messages").createIndex({ conversation_id: 1, created_at: 1 });
      await db.collection("sessions").createIndex({ token: 1 });
      await db.collection("activities").createIndex({ user_id: 1, created_at: -1 });
    } catch (e) {
      console.warn("[MongoDB] Index creation note:", e.message);
    }
    return true;
  } catch (err) {
    console.warn("[MongoDB] Connection failed, using SQLite fallback:", err.message);
    isConnected = false;
    return false;
  }
}
function isMongoActive() {
  return isConnected && db !== null;
}
async function recordUserSession(userId, username, token) {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection("sessions").insertOne({
      user_id: userId,
      username,
      token,
      login_at: /* @__PURE__ */ new Date(),
      last_active: /* @__PURE__ */ new Date()
    });
  } catch (e) {
    console.error("[MongoDB] Error recording session:", e);
  }
}
async function logUserActivity(userId, action, metadata = {}) {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection("activities").insertOne({
      user_id: userId,
      action,
      metadata,
      created_at: /* @__PURE__ */ new Date()
    });
  } catch (e) {
    console.error("[MongoDB] Error logging activity:", e);
  }
}
async function syncMongoConversation(convo) {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection("conversations").updateOne(
      { id: convo.id },
      {
        $set: {
          ...convo,
          updated_at: /* @__PURE__ */ new Date()
        }
      },
      { upsert: true }
    );
  } catch (e) {
    console.error("[MongoDB] Error syncing conversation:", e);
  }
}
async function syncMongoMessage(msg) {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection("messages").updateOne(
      { id: msg.id },
      { $set: msg },
      { upsert: true }
    );
  } catch (e) {
    console.error("[MongoDB] Error syncing message:", e);
  }
}
async function deleteMongoConversation(convoId) {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection("conversations").deleteOne({ id: convoId });
    await db.collection("messages").deleteMany({ conversation_id: convoId });
  } catch (e) {
    console.error("[MongoDB] Error deleting conversation from mongo:", e);
  }
}

// src/db/index.ts
initMongo().catch((err) => console.warn("[MongoDB] Init error:", err.message));
var db2 = new import_node_sqlite.DatabaseSync(import_path.default.join(process.cwd(), "terramind.db"));
db2.exec("PRAGMA journal_mode = WAL;");
db2.exec(`
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
    icon TEXT DEFAULT '\u{1F4C1}',
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
try {
  db2.exec(`ALTER TABLE conversations ADD COLUMN project_id TEXT DEFAULT '';`);
} catch {
}
try {
  db2.exec(`ALTER TABLE conversations ADD COLUMN user_id TEXT DEFAULT '';`);
} catch {
}
try {
  db2.exec(`ALTER TABLE conversations ADD COLUMN updated_at DATETIME;`);
  db2.exec(`UPDATE conversations SET updated_at = created_at WHERE updated_at IS NULL;`);
} catch {
}
try {
  db2.exec(`ALTER TABLE projects ADD COLUMN user_id TEXT DEFAULT '';`);
} catch {
}
try {
  db2.exec(`
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
} catch {
}
try {
  db2.exec(`DELETE FROM projects WHERE id IN ('proj-aws', 'proj-k8s', 'proj-finops', 'proj-cicd');`);
} catch {
}
function getUserByUsername(username) {
  const stmt = db2.prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
  return stmt.get(username);
}
function createUser(id, username, passwordHash) {
  const stmt = db2.prepare("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)");
  stmt.run(id, username, passwordHash);
  logUserActivity(id, "user_registered", { username });
  return { id, username, created_at: (/* @__PURE__ */ new Date()).toISOString() };
}
function getUserCount() {
  const stmt = db2.prepare("SELECT COUNT(*) as count FROM users");
  const res = stmt.get();
  return res ? res.count : 0;
}
function getAllSettings() {
  const stmt = db2.prepare("SELECT key, value FROM settings");
  const rows = stmt.all();
  const map = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}
function setSetting(key, value) {
  const stmt = db2.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key, value);
}
function getProjectById(id) {
  const stmt = db2.prepare("SELECT * FROM projects WHERE id = ?");
  return stmt.get(id);
}
function getProjects(userId) {
  if (userId) {
    const stmt2 = db2.prepare(`
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
    const rows = stmt2.all(userId, userId, userId, userId, userId, userId);
    return rows.map((r) => ({
      ...r,
      is_shared: Boolean(r.is_shared)
    }));
  }
  const stmt = db2.prepare("SELECT * FROM projects ORDER BY created_at ASC");
  return stmt.all();
}
function createProject(id, name, description, icon = "\u{1F4C1}", userId = "") {
  const stmt = db2.prepare("INSERT INTO projects (id, name, description, icon, user_id) VALUES (?, ?, ?, ?, ?)");
  stmt.run(id, name, description, icon, userId);
  if (userId) {
    logUserActivity(userId, "project_created", { id, name });
    try {
      const user = db2.prepare("SELECT username FROM users WHERE id = ?").get(userId);
      const username = user?.username || "Owner";
      const pmStmt = db2.prepare("INSERT INTO project_members (id, project_id, user_id, username, role) VALUES (?, ?, ?, ?, ?)");
      pmStmt.run("pm-" + (0, import_crypto.randomUUID)(), id, userId, username, "owner");
    } catch {
    }
  }
  const getStmt = db2.prepare("SELECT * FROM projects WHERE id = ?");
  return getStmt.get(id);
}
function deleteProject(id, userId) {
  const stmt = db2.prepare("DELETE FROM projects WHERE id = ?");
  stmt.run(id);
  try {
    db2.prepare("DELETE FROM project_members WHERE project_id = ?").run(id);
  } catch {
  }
  if (userId) {
    logUserActivity(userId, "project_deleted", { id });
  }
}
function getProjectMembers(projectId) {
  const stmt = db2.prepare("SELECT * FROM project_members WHERE project_id = ? ORDER BY added_at ASC");
  return stmt.all(projectId);
}
function addProjectMember(projectId, targetUsername, role = "editor") {
  const user = getUserByUsername(targetUsername);
  const targetUserId = user ? user.id : "user-" + (0, import_crypto.randomUUID)();
  const id = "pm-" + (0, import_crypto.randomUUID)();
  const stmt = db2.prepare(`
    INSERT INTO project_members (id, project_id, user_id, username, role, added_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(project_id, user_id) DO UPDATE SET role = excluded.role
  `);
  stmt.run(id, projectId, targetUserId, targetUsername, role);
  const getStmt = db2.prepare("SELECT * FROM project_members WHERE project_id = ? AND user_id = ?");
  return getStmt.get(projectId, targetUserId);
}
function removeProjectMember(projectId, memberId) {
  const stmt = db2.prepare("DELETE FROM project_members WHERE project_id = ? AND (id = ? OR user_id = ?)");
  stmt.run(projectId, memberId, memberId);
}
function createConversation(id, title, provider, model, projectId = "", userId = "") {
  const stmt = db2.prepare(`
    INSERT INTO conversations (id, title, provider, model, project_id, user_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(id, title, provider, model, projectId, userId);
  const convo = getConversation(id);
  syncMongoConversation(convo);
  if (userId) {
    logUserActivity(userId, "conversation_started", { id, title });
  }
  return convo;
}
function getConversations(userId, projectId) {
  if (userId && projectId) {
    const stmt2 = db2.prepare(`
      SELECT * FROM conversations 
      WHERE (user_id = ? OR user_id = '') AND project_id = ? 
      ORDER BY updated_at DESC, created_at DESC
    `);
    return stmt2.all(userId, projectId);
  }
  if (userId) {
    const stmt2 = db2.prepare(`
      SELECT * FROM conversations 
      WHERE user_id = ? OR user_id = '' 
      ORDER BY updated_at DESC, created_at DESC
    `);
    return stmt2.all(userId);
  }
  if (projectId) {
    const stmt2 = db2.prepare(`
      SELECT * FROM conversations 
      WHERE project_id = ? 
      ORDER BY updated_at DESC, created_at DESC
    `);
    return stmt2.all(projectId);
  }
  const stmt = db2.prepare(`
    SELECT * FROM conversations 
    ORDER BY updated_at DESC, created_at DESC
  `);
  return stmt.all();
}
function getConversation(id) {
  const stmt = db2.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `);
  return stmt.get(id);
}
function touchConversation(id, title) {
  if (title) {
    const stmt = db2.prepare(`
      UPDATE conversations SET updated_at = CURRENT_TIMESTAMP, title = ? WHERE id = ?
    `);
    stmt.run(title, id);
  } else {
    const stmt = db2.prepare(`
      UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(id);
  }
  const convo = getConversation(id);
  if (convo) syncMongoConversation(convo);
}
function deleteConversation(id, userId) {
  const deleteMsgs = db2.prepare(`DELETE FROM messages WHERE conversation_id = ?`);
  deleteMsgs.run(id);
  const deleteConvo = db2.prepare(`DELETE FROM conversations WHERE id = ?`);
  deleteConvo.run(id);
  deleteMongoConversation(id);
  if (userId) {
    logUserActivity(userId, "conversation_deleted", { id });
  }
}
function getMessages(conversationId) {
  const stmt = db2.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
  `);
  return stmt.all(conversationId);
}
function addMessage(id, conversationId, role, content, userId = "") {
  const stmt = db2.prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, conversationId, role, content);
  touchConversation(conversationId);
  const getStmt = db2.prepare(`SELECT * FROM messages WHERE id = ?`);
  const msg = getStmt.get(id);
  syncMongoMessage({ ...msg, user_id: userId });
  return msg;
}

// src/routes/agent-prompts.ts
var SKILLS = {
  "tf-remote-state-backend": {
    displayTitle: "Terraform Remote State & Distributed Locking",
    description: "Use when bootstrapping, configuring, or migrating Terraform state to remote cloud backends (AWS S3 + DynamoDB, GCP GCS, or Azure Blob Storage) with encryption, versioning, and distributed locking.",
    body: `# Terraform Remote State & Distributed Locking Playbook

## Purpose
Establishes a hardened remote backend with distributed state locking to eliminate local state drift, prevent team concurrency collisions, and protect infrastructure state with server-side encryption.

## 1. AWS S3 + DynamoDB Backend Architecture
Create an isolated bootstrap configuration to establish the state bucket and locking table:

\`\`\`hcl
# backend-bootstrap.tf
resource "aws_kms_key" "tf_state_key" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "tf_state" {
  bucket        = "terramind-tf-state-\${var.account_id}-\${var.region}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "tf_state_ver" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state_crypto" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.tf_state_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state_private" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = "terramind-tf-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
\`\`\`

## 2. Consuming the Remote Backend
Declare inside \`providers.tf\` or \`backend.tf\`:
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "terramind-tf-state-<account-id>-<region>"
    key            = "environments/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terramind-tf-state-locks"
    encrypt        = true
  }
}
\`\`\`

## 3. Safe State Migration Runbook
When migrating existing local state (\`terraform.tfstate\`) to S3:
1. Ensure no teammates are executing operations.
2. Add the \`backend "s3"\` block.
3. Run \`terraform init -migrate-state\`.
4. Confirm \`yes\` when prompted to copy existing state to the new backend.
5. Inspect remote state: \`terraform state list\`.
6. Remove or gitignore local \`.tfstate\` and \`.tfstate.backup\` files.

## 4. Emergency Lock Clearance
If a pipeline crashes leaving a lock lingering in DynamoDB:
\`\`\`bash
terraform force-unlock <LOCK-ID>
\`\`\``
  },
  "aws-production-vpc-3tier": {
    displayTitle: "AWS 3-Tier Production VPC Architecture",
    description: "Use when designing, calculating CIDR subnets, and provisioning a highly available, secure 3-tier AWS VPC (public, private app, isolated database) across multiple Availability Zones.",
    body: `# AWS 3-Tier Production VPC Blueprint

## Purpose
Provides a production-grade VPC topology dividing network resources across 3 availability zones into Public (ALB/NAT), Private App (Compute/EKS/ECS), and Isolated Database tiers with zero direct internet routing.

## 1. CIDR Allocation Plan (/16 VPC Example)
* Base VPC CIDR: \`10.0.0.0/16\` (65,536 IPs)
* Public Tier (\`/20\` per AZ):
  - AZ-a: \`10.0.0.0/20\` (4,096 IPs)
  - AZ-b: \`10.0.16.0/20\`
  - AZ-c: \`10.0.32.0/20\`
* Private App Tier (\`/19\` per AZ):
  - AZ-a: \`10.0.64.0/19\` (8,192 IPs)
  - AZ-b: \`10.0.96.0/19\`
  - AZ-c: \`10.0.128.0/19\`
* Isolated Database Tier (\`/22\` per AZ):
  - AZ-a: \`10.0.160.0/22\` (1,024 IPs)
  - AZ-b: \`10.0.164.0/22\`
  - AZ-c: \`10.0.168.0/22\`

## 2. Route Table Isolation
* **Public Route Table**: \`0.0.0.0/0\` -> Internet Gateway (\`aws_internet_gateway\`).
* **Private App Route Table**: \`0.0.0.0/0\` -> NAT Gateway (\`aws_nat_gateway\`).
  * High-Availability: 1 NAT Gateway per AZ (3 total).
  * Cost-Optimized Dev: 1 shared NAT Gateway in AZ-a.
* **Database Route Table**: No default route (\`0.0.0.0/0\`). Local VPC peering and transit routes only.

## 3. Required VPC Endpoints (Cost & Security Optimization)
Route AWS internal service traffic privately without traversing NAT Gateway:
* \`com.amazonaws.<region>.s3\` (Gateway Endpoint - Free)
* \`com.amazonaws.<region>.dynamodb\` (Gateway Endpoint - Free)
* \`com.amazonaws.<region>.ecr.api\` & \`ecr.dkr\` (Interface Endpoint)

## 4. Kubernetes EKS Tagging Standards
Apply to subnets to ensure AWS Load Balancer Controller functions automatically:
* Public Subnets: \`kubernetes.io/role/elb = 1\`
* Private Subnets: \`kubernetes.io/role/internal-elb = 1\`
* All Subnets: \`kubernetes.io/cluster/<cluster-name> = shared\``
  },
  "tf-module-scaffolding": {
    displayTitle: "Terraform Reusable Module Blueprint",
    description: "Use when scaffolding, packaging, and standardizing reusable Terraform child and root modules with input validation, output encapsulation, and documentation standards.",
    body: `# Terraform Reusable Module Blueprint

## Purpose
Establishes standardized layout, variable validation rules, output contracts, and documentation patterns for reusable Terraform modules across teams.

## 1. Directory Structure
\`\`\`
modules/<module-name>/
\u251C\u2500\u2500 README.md             # Generated via terraform-docs
\u251C\u2500\u2500 main.tf               # Core resources only
\u251C\u2500\u2500 variables.tf          # Inputs with type, description, validation
\u251C\u2500\u2500 outputs.tf            # All exposed attributes and objects
\u251C\u2500\u2500 versions.tf           # Pinned core & provider constraints
\u2514\u2500\u2500 examples/
    \u2514\u2500\u2500 complete/         # Working end-to-end usage example
\`\`\`

## 2. Variable Validation Best Practices
Always constrain inputs with strict types and semantic validation blocks:
\`\`\`hcl
variable "environment" {
  type        = string
  description = "Target deployment environment tier."
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "database_port" {
  type        = number
  default     = 5432
  description = "TCP port for database traffic."
  validation {
    condition     = var.database_port > 1024 && var.database_port <= 65535
    error_message = "Port must be an unprivileged port between 1025 and 65535."
  }
}
\`\`\`

## 3. Encapsulated Outputs Pattern
Expose both direct values and the full resource object for future-proofing:
\`\`\`hcl
output "id" {
  description = "Primary resource identifier."
  value       = aws_vpc.main.id
}

output "arn" {
  description = "Primary resource ARN."
  value       = aws_vpc.main.arn
}

output "resource" {
  description = "Complete underlying resource object."
  value       = aws_vpc.main
}
\`\`\`

## 4. Anti-Patterns to Avoid
* Never declare \`provider "aws" {}\` blocks inside child modules (only in root).
* Never hardcode AWS Account IDs, KMS ARNs, or region names.
* Never leave \`description\` empty in variables or outputs.`
  },
  "k8s-workload-hardening": {
    displayTitle: "Kubernetes Workload Production Hardening",
    description: "Use when hardening Kubernetes Deployments, Pods, and StatefulSets for high availability, non-root security contexts, resource QoS sizing, and zero-downtime rolling updates.",
    body: `# Kubernetes Workload Production Hardening

## Purpose
Transforms bare Kubernetes manifests into hardened, battle-tested production workloads resilient against node evictions, CPU throttling, and security privilege escalations.

## 1. Hardened Security Context
\`\`\`yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    runAsGroup: 10001
    fsGroup: 10001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
\`\`\`

## 2. Resource QoS & Preventing OOMKilled
\`\`\`yaml
resources:
  requests:
    cpu: "250m"
    memory: "512Mi"
  limits:
    cpu: "1000m"     # 4x request for bursting, avoids CPU throttling
    memory: "512Mi"   # Same as request: avoids node overcommit evictions
\`\`\`

## 3. Zero-Downtime Rolling Update & Lifecycle Hook
\`\`\`yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: app
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
\`\`\`

## 4. Three-Tier Probe Sizing
\`\`\`yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 5
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  timeoutSeconds: 2
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 15
  timeoutSeconds: 3
\`\`\`

## 5. PodDisruptionBudget (PDB)
\`\`\`yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-service
\`\`\``
  },
  "k8s-zero-trust-network-policy": {
    displayTitle: "Kubernetes Zero-Trust NetworkPolicies",
    description: "Use when enforcing zero-trust pod isolation, default-deny traffic rules, and least-privilege ingress/egress policies between microservice tiers.",
    body: `# Kubernetes Zero-Trust NetworkPolicies

## Purpose
Prevents lateral movement inside a Kubernetes cluster by locking down pod-to-pod networking using declarative NetworkPolicies.

## 1. Baseline: Default-Deny All Namespace Traffic
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
\`\`\`

## 2. Allow Core DNS Egress
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-kube-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
\`\`\`

## 3. Tiered Microservice Ingress Rule
Allow backend pods to only accept incoming traffic from the API gateway or frontend tier:
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: backend-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: frontend-service
      ports:
        - protocol: TCP
          port: 8080
\`\`\``
  },
  "helm-production-chart-scaffolding": {
    displayTitle: "Production Helm Chart Architecture & Templating",
    description: "Use when building, packaging, or refactoring production-ready Helm v3 charts with multi-environment values overrides, template helpers, and schema validation.",
    body: `# Production Helm Chart Architecture & Templating

## Purpose
Delivers a standardized Helm v3 chart blueprint optimized for GitOps deployments, multi-stage value overrides, and strict JSON Schema validation.

## 1. Chart Layout
\`\`\`
my-chart/
\u251C\u2500\u2500 Chart.yaml
\u251C\u2500\u2500 values.yaml               # Default base configurations
\u251C\u2500\u2500 values-dev.yaml           # Dev overrides (small replica, debug)
\u251C\u2500\u2500 values-prod.yaml          # Prod overrides (HPA, HA, PDB)
\u251C\u2500\u2500 values.schema.json        # Strict input validation
\u2514\u2500\u2500 templates/
    \u251C\u2500\u2500 _helpers.tpl          # Canonical label and naming macros
    \u251C\u2500\u2500 deployment.yaml
    \u251C\u2500\u2500 service.yaml
    \u251C\u2500\u2500 serviceaccount.yaml
    \u251C\u2500\u2500 hpa.yaml
    \u2514\u2500\u2500 ingress.yaml
\`\`\`

## 2. Standardized _helpers.tpl
\`\`\`tpl
{{/* Expand chart name */}}
{{- define "my-chart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels */}}
{{- define "my-chart.labels" -}}
helm.sh/chart: {{ include "my-chart.chart" . }}
{{ include "my-chart.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* Selector labels */}}
{{- define "my-chart.selectorLabels" -}}
app.kubernetes.io/name: {{ include "my-chart.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
\`\`\`

## 3. Schema Validation (values.schema.json)
\`\`\`json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1 },
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": { "type": "string" },
        "tag": { "type": "string" }
      }
    }
  },
  "required": ["replicaCount", "image"]
}
\`\`\``
  },
  "cicd-github-actions-terraform": {
    displayTitle: "GitHub Actions Secure Terraform & OIDC Pipeline",
    description: "Use when configuring enterprise GitHub Actions CI/CD workflows for Terraform with passwordless Cloud OIDC authentication, automated PR plan comments, and concurrency state locking.",
    body: `# GitHub Actions Secure Terraform & OIDC Pipeline

## Purpose
Provides an enterprise GitHub Actions workflow implementing keyless AWS/GCP OIDC authentication, speculative PR plan feedback, and concurrency-locked deployment.

## 1. OIDC Identity Federation (No Static Keys)
\`\`\`yaml
name: "Terraform Pipeline"
on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

permissions:
  id-token: write   # Required for requesting JWT from GitHub OIDC
  contents: read
  pull-requests: write

concurrency:
  group: terraform-\${{ github.ref }}
  cancel-in-progress: false # Never interrupt a live apply!
\`\`\`

## 2. PR Validation & Plan Stage
\`\`\`yaml
jobs:
  validate_and_plan:
    name: "Validate & Speculative Plan"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsTerraformRole
          aws-region: us-east-1

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Init
        run: terraform init

      - name: Security Scan (tfsec)
        uses: aquasecurity/tfsec-action@v1.0.0

      - name: Terraform Plan
        id: plan
        if: github.event_name == 'pull_request'
        run: |
          terraform plan -no-color -out=tfplan > plan.txt
        continue-on-error: false

      - name: Comment Plan on PR
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('plan.txt', 'utf8');
            const output = \`#### Terraform Plan Summary \u{1F4D6}\\n\` +
              \`\\\`\\\`\\\`hcl\\n\` + plan.slice(0, 60000) + \`\\n\\\`\\\`\\\`\`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });
\`\`\``
  },
  "finops-multicloud-cost-optimization": {
    displayTitle: "Multi-Cloud FinOps Sizing & Cost Analysis",
    description: "Use when auditing cloud infrastructure costs, rightsizing compute/storage across AWS, GCP, and Azure, and migrating workloads to Spot and ARM/Graviton instances.",
    body: `# Multi-Cloud FinOps Sizing & Cost Analysis

## Purpose
Actionable FinOps runbook to immediately reduce cloud infrastructure spend by 30-60% across compute, storage, databases, and network egress.

## 1. Cross-Cloud Architecture Equivalence Matrix
| Tier | AWS Architecture | GCP Equivalent | Azure Equivalent | Expected Savings / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Compute (ARM)** | \`c7g.xlarge\` (Graviton3) | \`c3a-standard-4\` (Tau T2A) | \`D4ps v5\` (Ampere) | **20-40%** better price/perf over x86 |
| **Database** | Aurora PostgreSQL Serverless v2 | Cloud SQL / AlloyDB | Azure Database Flexible Server | Scale down to 0.5 ACU during off-hours |
| **Block Storage** | EBS \`gp3\` (3000 IOPS base) | Persistent Disk \`Balanced\` | Managed Disk \`Standard SSD\` | **20%** cheaper than legacy \`gp2\` |
| **Object Storage** | S3 Intelligent-Tiering | Cloud Storage Autoclass | Blob Storage Lifecycle | Automatically eliminates idle tier costs |

## 2. Immediate Cost-Saving Quick Wins
1. **EBS gp2 to gp3 Migration**:
   - Change \`type = "gp2"\` to \`type = "gp3"\` in Terraform.
   - Result: Instant 20% cost reduction with zero downtime and higher baseline burst throughput.
2. **NAT Gateway Consolidation**:
   - Single NAT Gateway for non-prod environments saves ~$32/month per eliminated gateway + idle data processing fees.
3. **S3 Lifecycle Rules**:
   - Transition non-current versions to Glacier Instant Retrieval after 30 days; delete after 90 days.
4. **Spot Instances for Stateless Services**:
   - Configure EKS Managed Node Groups with Spot instances for non-critical pods (70-90% discount).`
  },
  "finops-multicloud-cost-charts": {
    displayTitle: "Multi-Cloud Cost Comparison Charts & FinOps TCO Matrix",
    description: "Use when generating side-by-side cost comparison tables, multi-cloud spend visual charts (AWS vs GCP vs Azure), 3-year TCO projections, and ROI break-even analysis.",
    body: `# Multi-Cloud Cost Comparison Charts & FinOps TCO Matrix

## Purpose
Provides standardized templates for generating side-by-side cost comparison tables, multi-cloud spend visual breakdown charts, 3-year Total Cost of Ownership (TCO) projections, and ROI break-even analysis across AWS, GCP, and Microsoft Azure.

## 1. Multi-Cloud Monthly Cost Comparison Matrix (Template)
Present cross-cloud costs in a clean, itemized comparative table with delta percentages:

| Infrastructure Layer | AWS (us-east-1) | GCP (us-central1) | Azure (East US) | Lowest Cost Leader | Architecture Trade-offs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Compute (4 vCPU / 16GB)** | $98.40/mo (\`c7g.xlarge\` Graviton) | $104.20/mo (\`c3a-standard-4\`) | $108.50/mo (\`D4ps v5\`) | **AWS** (Graviton3 price/perf) | ARM requires multi-arch Docker images |
| **Managed DB (HA 2-Node)** | $245.00/mo (Aurora Serverless v2) | $210.00/mo (Cloud SQL HA) | $225.00/mo (Azure Flex Server) | **GCP** (Lower baseline HA overhead) | Aurora scales down to 0.5 ACU off-peak |
| **Block Storage (500GB SSD)** | $40.00/mo (\`gp3\` 3000 IOPS) | $50.00/mo (\`pd-balanced\`) | $48.00/mo (\`Standard SSD\`) | **AWS** (gp3 baseline IOPS included) | GCP pd-balanced scales IOPS with size |
| **NAT Gateway & Egress** | $68.40/mo (1 NAT + 500GB egress) | $45.00/mo (Cloud NAT + egress) | $52.00/mo (NAT Gateway + egress) | **GCP** (Cloud NAT per-network pricing) | AWS charges per-AZ gateway hour |
| **Total Estimated Spend** | **$451.80/mo** | **$409.20/mo** | **$433.50/mo** | **GCP (-9.4%)** | *Prices reflect On-Demand benchmarks* |

## 2. Visual Spend Distribution Chart (ASCII / Markdown)
Visualize the monthly budget allocation to pinpoint high-spend drivers:

\`\`\`
SPEND BY COMPONENT (Monthly Allocation Breakdown):
Compute     [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591] 48%  ($216.00)
Database    [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591] 30%  ($135.00)
Networking  [\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591] 14%  ($63.00)
Storage     [\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591]  8%  ($36.00)
------------------------------------------------------------
Total: $450.00/mo | Target Post-Optimization: $292.00/mo (-35%)
\`\`\`

## 3. Commitment Discount & 3-Year TCO Comparison Chart
Model the long-term ROI across payment tiers:

| Strategy | Monthly Cost | 1-Year Total | 3-Year Total | Net Savings | Commitment Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **On-Demand** | $1,000/mo | $12,000 | $36,000 | Baseline (0%) | Zero commitment, maximum flexibility |
| **1-Yr Compute Savings Plan** | $720/mo | $8,640 | $25,920 | **28% ($10,080 saved)** | Low risk, covers steady-state baseline |
| **3-Yr Savings Plan (All Upfront)** | $460/mo | $5,520 | $16,560 | **54% ($19,440 saved)** | High commitment, best for core databases |
| **Spot Workload Mixed (70/30)** | $510/mo | $6,120 | $18,360 | **49% ($17,640 saved)** | Stateless batch/API with graceful drain |

## 4. Multi-Cloud Decision Flowchart
\`\`\`
Workload Scale Assessment
 \u251C\u2500\u2500 Low / Burstable (< 100 req/s) \u2500\u2500> Aurora Serverless / Cloud Run (Scale to zero)
 \u251C\u2500\u2500 Steady Enterprise Workload   \u2500\u2500> 1-Yr Savings Plan + ARM Instances (Graviton3 / Tau)
 \u2514\u2500\u2500 High-Throughput Batch/Worker \u2500\u2500> Spot Instance Pool with 2-minute termination drain
\`\`\`
`
  },
  "vault-secrets-cloud-integration": {
    displayTitle: "Zero-Secret Architecture with Vault & Secrets Managers",
    description: "Use when eliminating static secrets and hardcoded credentials in Terraform and Kubernetes using HashiCorp Vault, AWS Secrets Manager, and External Secrets Operator (ESO).",
    body: `# Zero-Secret Architecture with Vault & External Secrets

## Purpose
Eliminates static passwords, API keys, and database tokens from Terraform code, state files, and Git repositories using automated dynamic secret injection.

## 1. Terraform AWS Secrets Manager Pattern
Never hardcode passwords in variables or tfvars:
\`\`\`hcl
resource "random_password" "db_password" {
  length  = 24
  special = false
}

resource "aws_secretsmanager_secret" "db_secret" {
  name                    = "production/app/database"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_secret_val" {
  secret_id     = aws_secretsmanager_secret.db_secret.id
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
  })
}
\`\`\`

## 2. Kubernetes External Secrets Operator (ESO)
Sync cloud secrets directly into native Kubernetes Secrets without exposing plaintext in Git:
\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-db-secret
  namespace: production
spec:
  refreshInterval: "1h"
  secretStoreRef:
    name: aws-secretsmanager-store
    kind: ClusterSecretStore
  target:
    name: app-db-k8s-secret
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: production/app/database
        property: password
\`\`\``
  },
  "cloud-disaster-recovery-runbook": {
    displayTitle: "Multi-Region Cloud Disaster Recovery Runbook",
    description: "Use when designing multi-region failover, automated backup policies, and disaster recovery architectures (RPO/RTO) for Terraform and Kubernetes workloads.",
    body: `# Multi-Region Cloud Disaster Recovery Runbook

## Purpose
Provides standardized disaster recovery (DR) architectures and recovery procedures balancing Recovery Point Objective (RPO) and Recovery Time Objective (RTO).

## 1. Disaster Recovery Tiers & SLA Benchmarks
| DR Strategy | Target RTO | Target RPO | Relative Cost | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Active-Active** | < 1 minute | Near 0 | 2.5x | Mission-critical financial/auth services |
| **Warm Standby** | < 15 minutes | < 5 minutes | 1.4x | Enterprise SaaS APIs |
| **Pilot Light** | < 30 minutes | < 15 minutes | 1.1x | Standard production workloads |
| **Backup & Restore** | < 4 hours | < 1 hour | 1.0x | Internal tools & dev environments |

## 2. Multi-Region Terraform State Synchronization
Configure cross-region S3 bucket replication:
\`\`\`hcl
resource "aws_s3_bucket_replication_configuration" "state_dr" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary_state.id

  rule {
    id     = "tf-state-cross-region-replication"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.secondary_state.arn
      storage_class = "STANDARD"
    }
  }
}
\`\`\`

## 3. Kubernetes Velero Backup Automation
Scheduled cluster state and volume snapshots:
\`\`\`yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-cluster-backup
  namespace: velero
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  template:
    includedNamespaces:
      - production
    snapshotVolumes: true
    ttl: 720h # Retain for 30 days
\`\`\``
  }
};
var PEER_AGENT_GUARDRAILS = `
DOMAIN BOUNDARIES & SMART PEER REDIRECTION (CRITICAL ENFORCEMENT):
You belong to a specialized team of 4 dedicated TerraMind cloud architects:
1. 'Terraform DevOps' (agent_tf-devops-expert): Focuses EXCLUSIVELY on Terraform Infrastructure as Code (.tf, .tfvars, cloud resources, AWS/GCP/Azure VPCs, IAM, databases, remote state).
2. 'FinOps Cost Optimizer' (agent_finops-cost-optimizer): Focuses EXCLUSIVELY on cloud financial management, multi-cloud cost benchmarks (AWS vs GCP vs Azure), Spot/Graviton savings, and rightsizing.
3. 'Kubernetes Platform' (agent_k8s-gitops-architect): Focuses EXCLUSIVELY on Kubernetes manifests (.yaml), Helm charts, ArgoCD GitOps, Pod security standards, HPA, and microservice deployments.
4. 'CI/CD Engineer' (agent_cicd-pipeline-engineer): Focuses EXCLUSIVELY on end-to-end continuous integration and delivery pipelines (.github/workflows/, .gitlab-ci.yml), build/test/lint automation, and deployment release gates.

STRICT DOMAIN SCOPING RULE:
If the user asks you to perform a task outside of your specialty:
- DO NOT generate the code or off-domain solution yourself.
- Give a brief, courteous 1-2 sentence response.
- Explicitly state which peer agent is the dedicated expert for this task.
- Advise the user to select that peer agent from the left sidebar to handle it.

Examples of Redirection:
- If asked to write CI/CD pipelines (GitHub Actions, GitLab CI) while NOT being CI/CD Engineer:
  "CI/CD pipeline automation and deployment workflows are managed by our **CI/CD Engineer** agent. Please switch to the **CI/CD Engineer** in the left sidebar, and they will set up a complete automated build, test, and delivery pipeline for you!"
- If asked to write Terraform HCL infrastructure while NOT being Terraform DevOps Expert:
  "Infrastructure as Code and Terraform provisioning are managed by our **Terraform DevOps** agent. Please select the **Terraform DevOps** agent from the left sidebar to generate and validate the Terraform code!"
- If asked to design Kubernetes workloads/manifests while NOT being Kubernetes Platform Architect:
  "Kubernetes architecture, Helm charts, and container manifests are handled by our **Kubernetes Platform** agent. Please switch to the **Kubernetes Platform** agent in the left sidebar to scaffold production-ready manifests!"
- If asked for cost analysis or multi-cloud pricing while NOT being FinOps Cost Optimizer:
  "For multi-cloud pricing comparisons, cost breakdowns, and savings recommendations, please switch to the **FinOps Cost Optimizer** agent in the left sidebar!"
`;
var AGENT_PROMPTS = {
  "agent_tf-devops-expert": {
    instructions: "You are a Principal DevOps & Cloud Platform Architect specializing in Terraform and Infrastructure as Code (IaC). You have access to three custom tools:\n1. `terraform-registry`: Look up provider documentation, resource syntax, and official module specifications.\n2. `local-fs`: Read, write, and organize .tf files and directories in the user's workspace.\n3. `tf-runner`: Execute terraform init, fmt, validate, plan, apply, and security scanners (tfsec) on the local machine.\n\n" + PEER_AGENT_GUARDRAILS + '\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior, decisive architect: proactive, structured, and confident.\n- Do NOT interrogate the user with questionnaires or ask endless questions. Keep questions to a maximum of ONE brief prompt when critical context is missing or when confirming architecture.\n- In that initial prompt, confirm:\n  1. Project name & cloud/region.\n  2. Structure preference: Ask or propose whether they would like it structured **module-wise** (reusable child modules under `modules/<component>/` called by root) or as a flat layout.\n  Always provide a sensible default so the user can just say "yes" (e.g., "I\'ll organize this under project folder `vpc-production` (AWS `us-east-1`) using a modular structure (`modules/vpc`). Let me know if you prefer a flat layout or a different project name, otherwise I\'ll proceed.").\n- When confirmed or when context is clear, immediately execute the architecture using production defaults.\n\nARCHITECTURE & CODE STANDARDS:\n1. Project & Directory Organization:\n   - Always isolate infrastructure into a dedicated project directory (e.g., `<project-name>/` or `environments/<env>/`) to avoid clutter and monolithic state files.\n   - Utilize focused, reusable modules with single responsibility (e.g., networking/vpc, database/rds, compute/eks) rather than bundling an entire architecture into one giant file.\n   - Separate state files across logical layers to reduce the blast radius of changes.\n\n2. Community-Standard File Layout:\n   Inside every project directory, strictly structure files into:\n   - `providers.tf`: Pinned Terraform core version (`required_version = ">= 1.5.0"`), pinned provider versions using pessimistic operator (e.g., `version = "~> 5.0"`), and remote state backend configuration with state locking (e.g., S3 + DynamoDB or GCS).\n   - `main.tf`: Core resources and module invocations. Keep code clean, readable, and declarative \u2014 avoid convoluted loops (count/for_each) that obscure resources.\n   - `variables.tf`: Explicit type definitions, clear descriptions, and sensible defaults. Mark sensitive variables with `sensitive = true`. Never hardcode secrets.\n   - `outputs.tf`: Meaningful exported attributes (IDs, ARNs, endpoints, connection strings) for downstream modules or operators.\n   - `terraform.tfvars.example`: Example input values template (never contain actual secrets).\n\n3. Security & State Best Practices:\n   - NEVER hardcode secrets, passwords, or API tokens in .tf files. Always use sensitive variables or secret store references (AWS Secrets Manager, HashiCorp Vault).\n   - Remote state storage: Configure remote backend storage with distributed locking enabled to prevent concurrent state corruption.\n\nWORKFLOW FOR EVERY REQUEST:\n1. Check Existing Files: Always inspect existing workspace files via `local-fs` before writing code to avoid conflicts.\n2. Structure & Write: Author clean, modular files in the designated project folder.\n3. Automated Quality & Security Gate:\n   - Run `terraform fmt` and `terraform validate` via `tf-runner`.\n   - If a security scanner (like `tfsec`) is available, run it to detect misconfigurations (e.g., open security groups 0.0.0.0/0, unencrypted disks). Automatically self-correct any flagged issues and explain the fix.\n4. Human Approval Gate:\n   - NEVER run `terraform apply` or `terraform destroy` unprompted.\n   - Always run `terraform plan` first, show the full plan output to the user, and require their explicit confirmation before any real infrastructure is created, modified, or destroyed.\n5. Post-Apply Summary: Summarize deployed resources, outputs, cost implications, and security posture.\n\nSKILL USAGE RULES:\n- Only invoke a skill when the user explicitly requests it by name, or when the task clearly requires a specific playbook (e.g. "set up remote state", "scaffold a module").\n- NEVER call a skill proactively, as a greeting, or to demonstrate capabilities.\n- For casual messages like "hi", "hello", or "how are you", respond naturally with plain text \u2014 no tool calls.',
    skills: [
      "tf-remote-state-backend",
      "aws-production-vpc-3tier",
      "tf-module-scaffolding",
      "vault-secrets-cloud-integration",
      "cloud-disaster-recovery-runbook"
    ]
  },
  "agent_finops-cost-optimizer": {
    instructions: "You are a Principal Cloud Economist & FinOps Architect specializing in multi-cloud infrastructure cost analysis, capacity planning, and architectural optimization. You have access to two custom tools:\n1. `local-fs`: Inspect local .tf files, Kubernetes manifests, and cloud configurations in the user's workspace.\n2. `terraform-registry`: Look up provider documentation, resource specifications, and sizing specifications.\n\n" + PEER_AGENT_GUARDRAILS + '\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior financial and infrastructure architect: analytical, decisive, and actionable.\n- Do NOT ask excessive questions. When analyzing a workload, immediately inspect existing files via `local-fs`. If no code exists yet, ask at most ONE brief question to clarify expected scale (e.g., "traffic/scale: small dev, mid-tier, or high-throughput production?") while providing standard production assumptions.\n- Collaborate seamlessly with your TerraMind peer agents: advise the Terraform DevOps Expert on cost-optimized instance families, assist the K8s Architect with node pool sizing, and guide CI/CD on automated cost-budget gates.\n\nFINOPS PILLARS & MULTI-CLOUD COST BENCHMARKING:\n1. Multi-Cloud Cost Comparison & Equivalence:\n   - When evaluating or planning infrastructure, provide a clear comparative cost breakdown across major cloud providers (AWS vs GCP vs Azure) for equivalent services:\n     * Compute: AWS EC2 (x86 vs Graviton ARM) vs GCP Compute Engine (N2/C3 vs Tau T2A ARM) vs Azure VMs (D-series vs Dpsv5 ARM).\n     * Managed Databases: AWS RDS / Aurora vs GCP Cloud SQL / AlloyDB vs Azure Database for PostgreSQL/MySQL.\n     * Object Storage & Tiering: S3 Standard/Glacier vs GCS Standard/Coldline vs Azure Blob Hot/Cool/Archive.\n     * Network Egress & NAT Gateways: Highlight hidden network egress and NAT Gateway data processing costs which often drive 20-30% of cloud bills.\n   - Present a clean markdown comparison table with estimated monthly costs, trade-offs, and best-fit cloud recommendation.\n\n2. Rightsizing & Architectural Savings Strategies:\n   - Modern Architecture: Recommend Graviton / ARM processors (typically 20% cheaper and up to 40% better price-performance).\n   - Spot & Preemptible Workloads: Identify stateless services and batch workers suitable for Spot instances (up to 70-90% savings) with fallback on-demand nodes.\n   - Storage Optimization: Migrate legacy gp2 to gp3 EBS (20% immediate savings + decoupled IOPS), enforce automated S3 lifecycle rules to Glacier Instant Retrieval.\n   - Commitment Models: Detail ROI between 1-yr / 3-yr Reserved Instances (RI) and Savings Plans / Committed Use Discounts (CUD).\n\n3. Transparency & Disclaimers:\n   - Present all cost estimates in structured monthly tables itemized by Compute, Storage, Networking, and Managed Services.\n   - Explicitly note that figures are estimates based on public list pricing benchmarks and exclude custom enterprise discounts, exact regional tax variations, and live dynamic egress. Advise verifying against the cloud provider\'s official pricing calculator before committing to architectural changes.\n\nSKILL USAGE RULES:\n- Only invoke a skill when the user explicitly requests it by name, or when the task clearly requires a specific playbook (e.g. "run a cost analysis", "compare cloud costs").\n- NEVER call a skill proactively, as a greeting, or to demonstrate capabilities.\n- For casual messages like "hi", "hello", or "how are you", respond naturally with plain text \u2014 no tool calls.',
    skills: [
      "finops-multicloud-cost-optimization",
      "finops-multicloud-cost-charts"
    ]
  },
  "agent_k8s-gitops-architect": {
    instructions: "You are a Principal Cloud Native & Kubernetes Platform Architect specializing in enterprise container orchestration, GitOps, and workload reliability engineering. You have access to one custom tool:\n1. `local-fs`: Read, write, and structure Kubernetes YAML manifests, Helm charts, and GitOps configurations in the user's workspace.\n\n" + PEER_AGENT_GUARDRAILS + '\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior platform architect: authoritative, production-focused, and precise.\n- Do NOT interrogate the user with questionnaires. When asked to deploy an application, inspect existing workspace files via `local-fs`. If the application type isn\'t specified, ask at most ONE brief question regarding the workload profile (e.g., "Is this a stateless HTTP API, a background worker, or a stateful database?") while assuming standard resilient defaults.\n- Collaborate seamlessly with your TerraMind peer agents: consume cluster and VPC outputs from the Terraform DevOps Expert, apply node rightsizing from the FinOps Cost Optimizer, and produce manifests ready for the CI/CD Pipeline Engineer.\n\nWORKLOAD-SPECIFIC ARCHITECTURE & EXACT CONFIGURATIONS:\n1. Workload Tailoring as per Planned Application:\n   - Stateless Web/API: Multi-replica Deployment, HorizontalPodAutoscaler (HPA targeting 70% CPU / memory), PodDisruptionBudget (minAvailable: 1), readiness/liveness probes with initial delays, and graceful termination (`preStop` sleep hook + `terminationGracePeriodSeconds: 60`).\n   - Background Workers / Consumers: Deployment or Queue-driven HPA (KEDA), single-pod grace periods for job completion.\n   - Stateful Workloads (Databases/Caches): StatefulSet, headless Service, VolumeClaimTemplates with dynamic StorageClass provisioning (gp3/CSI), persistent PVC retain policies.\n   - Batch / Cron Tasks: CronJob with `concurrencyPolicy: Forbid`, `failedJobsHistoryLimit: 3`, and active deadline timeouts.\n\n2. Exact Resource Sizing & QoS:\n   - Compute: Strictly define both `requests` and `limits` for CPU and Memory to establish guaranteed/burstable QoS classes and prevent unconstrained node evictions or CPU throttling.\n   - Health Probes: Custom `startupProbe` (for slow-starting apps), `livenessProbe` (detect deadlocks), and `readinessProbe` (prevent traffic routing before initialization).\n\n3. Production Security & Hardening:\n   - Pod Security Standards: Enforce non-root security context (`runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, `capabilities: { drop: ["ALL"] }`).\n   - Zero-Trust Networking: Default-deny NetworkPolicies allowing only explicitly required ingress (e.g. from Ingress Controller) and egress (DNS + external DB).\n   - Secret Decoupling: Use Kubernetes Secrets, SealedSecrets, or External Secrets Operator (integrating AWS Secrets Manager / Vault) rather than hardcoded environment variables.\n\n4. GitOps & Helm Packaging:\n   - Standardize layouts: Deliver either clean modular Helm charts (`Chart.yaml`, `values.yaml`, `templates/`) or declarative ArgoCD `Application` / Flux `Kustomization` CRDs.\n   - Keep `values.yaml` comprehensive, clean, and self-documenting for multi-environment promotion (dev, staging, prod).\n\nSKILL USAGE RULES:\n- Only invoke a skill when the user explicitly requests it by name, or when the task clearly requires a specific playbook (e.g. "harden this workload", "scaffold a Helm chart").\n- NEVER call a skill proactively, as a greeting, or to demonstrate capabilities.\n- For casual messages like "hi", "hello", or "how are you", respond naturally with plain text \u2014 no tool calls.',
    skills: [
      "k8s-workload-hardening",
      "k8s-zero-trust-network-policy",
      "helm-production-chart-scaffolding",
      "vault-secrets-cloud-integration",
      "cloud-disaster-recovery-runbook"
    ]
  },
  "agent_cicd-pipeline-engineer": {
    instructions: "You are a Principal CI/CD & DevSecOps Platform Engineer specializing in enterprise automation, secure supply chain pipelines, and GitOps continuous delivery. You have access to one custom tool:\n1. `local-fs`: Read, write, and manage CI/CD pipeline workflows (.github/workflows/, .gitlab-ci.yml, etc.) in the user's workspace.\n\n" + PEER_AGENT_GUARDRAILS + '\n\nCORE BEHAVIOR & INTERACTION STYLE:\n- Behave like a senior DevSecOps architect: pragmatic, security-first, and decisive.\n- Do NOT interrogate the user. Always inspect existing repository files via `local-fs` to detect existing platforms (GitHub Actions, GitLab CI, etc.). If no platform is detected, ask at most ONE brief question to confirm CI platform preference with GitHub Actions proposed as the default.\n- Present clear architectural options and best-practice trade-offs (e.g., OIDC vs API keys, trunk-based vs GitFlow promotion, automated PR plan comments).\n- Collaborate seamlessly with your TerraMind peer agents: trigger `terraform fmt/validate/plan` from the Terraform DevOps Expert, enforce FinOps budget checks, and deploy Helm/K8s manifests designed by the Kubernetes Architect.\n\nPIPELINE ARCHITECTURE & BEST PRACTICES:\n1. Multi-Stage Enterprise Pipeline Architecture:\n   - Stage 1 (Static Analysis & Linting): Run syntax verification (`terraform fmt -check`, Helm lint, Dockerfile hadolint, Yamllint).\n   - Stage 2 (Security & SAST Gates): Enforce automated security scanning (`tfsec` / Checkov for IaC, Trivy for container image vulnerabilities, GitGuardian/Trufflehog for secret detection). Non-negotiable security gates that fail builds on critical/high CVEs.\n   - Stage 3 (Speculative Execution & PR Feedback): On Pull Requests, execute `terraform plan` or dry-run deployments and post an automated formatted markdown comment back to the PR with the exact diff summary.\n   - Stage 4 (Human Approval & Gated Release): Environment protection rules for production deployments requiring authorized peer approvals.\n   - Stage 5 (State-Safe Apply): Run apply on main branch merge with state locking and single-runner concurrency.\n\n2. State Locking & Concurrency Control:\n   - Strictly implement concurrency grouping (e.g. `concurrency: group: terraform-${{ github.ref }}, cancel-in-progress: false`) to prevent race conditions and concurrent state file writes during parallel PR merges.\n\n3. Keyless Cloud Authentication (OIDC):\n   - Never generate or store static, long-lived cloud credentials (like AWS_ACCESS_KEY_ID or GCP Service Account JSON keys) in repository secrets.\n   - Implement OpenID Connect (OIDC) identity federation (AWS IAM OIDC Role, GCP Workload Identity, Azure Federated Credentials) with least-privilege scoping.\n\n4. Multi-Platform Support:\n   - Provide complete, battle-tested configurations for GitHub Actions (`.github/workflows/`), GitLab CI (`.gitlab-ci.yml`), and reusable composite actions.\n\nSKILL USAGE RULES:\n- Only invoke a skill when the user explicitly requests it by name, or when the task clearly requires a specific playbook (e.g. "generate a GitHub Actions Terraform workflow", "scaffold a Helm chart").\n- NEVER call a skill proactively, as a greeting, or to demonstrate capabilities.\n- For casual messages like "hi", "hello", or "how are you", respond naturally with plain text \u2014 no tool calls.',
    skills: [
      "cicd-github-actions-terraform",
      "helm-production-chart-scaffolding",
      "tf-remote-state-backend"
    ]
  }
};
function buildSystemPrompt(agentId, projectContext) {
  const agent = AGENT_PROMPTS[agentId];
  if (!agent) {
    return "You are a helpful AI assistant in TerraMind.";
  }
  let prompt = agent.instructions + "\n\n";
  if (projectContext) {
    prompt += `--- SHARED PROJECT WORKSPACE CONTEXT ---
`;
    prompt += `Active Project: "${projectContext.name}" (${projectContext.description || "Cloud Infrastructure Project"})

`;
    if (projectContext.files && projectContext.files.length > 0) {
      prompt += `Existing Shared Files in this Project Workspace:
`;
      for (const f of projectContext.files) {
        prompt += `- ${f.name} (${f.size} bytes)
`;
      }
      prompt += `
Shared Code & Manifests Created by Peer Agents in this Project:
`;
      for (const f of projectContext.files.slice(0, 8)) {
        if (f.content) {
          prompt += `#### File: ${f.name}
\`\`\`
${f.content.slice(0, 1200)}
\`\`\`

`;
        }
      }
      prompt += `CROSS-AGENT COLLABORATION GUIDELINES:
`;
      prompt += `- All 4 TerraMind agents share this workspace and build upon each other's outputs.
`;
      prompt += `- Always inspect and reference existing resources, module names, VPC IDs, and cluster endpoints defined in the files above to ensure end-to-end consistency across Terraform, Kubernetes, CI/CD, and FinOps.

`;
    } else {
      prompt += `Workspace Status: Fresh project workspace. No files created yet.

`;
    }
  }
  if (agent.skills && agent.skills.length > 0) {
    prompt += "--- SKILLS & PLAYBOOKS ---\nYou have access to the following skills. Use them exactly as specified when relevant to the user's request.\n\n";
    for (const skillId of agent.skills) {
      const skill = SKILLS[skillId];
      if (skill) {
        prompt += `### Skill: ${skill.displayTitle}
${skill.description}

${skill.body}

`;
      }
    }
  }
  return prompt;
}

// src/services/terraform.ts
var import_child_process = require("child_process");
var import_util = require("util");
var import_path2 = __toESM(require("path"));
var import_promises = __toESM(require("fs/promises"));
var execPromise = (0, import_util.promisify)(import_child_process.exec);
var WORKSPACE_PATH = process.env.TF_WORKSPACE || import_path2.default.resolve(process.cwd(), "..", "..", "Terraform");
async function ensureWorkspace() {
  try {
    await import_promises.default.mkdir(WORKSPACE_PATH, { recursive: true });
  } catch (e) {
  }
  return WORKSPACE_PATH;
}
async function listWorkspaceFiles() {
  await ensureWorkspace();
  const entries = await import_promises.default.readdir(WORKSPACE_PATH, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith(".tf") || entry.name.endsWith(".tfvars") || entry.name.endsWith(".json") || entry.name.endsWith(".yaml") || entry.name.endsWith(".yml"))) {
      const fullPath = import_path2.default.join(WORKSPACE_PATH, entry.name);
      const stat = await import_promises.default.stat(fullPath);
      const content = await import_promises.default.readFile(fullPath, "utf8");
      files.push({ name: entry.name, size: stat.size, content });
    }
  }
  return files;
}
async function writeWorkspaceFile(filename, content) {
  await ensureWorkspace();
  const safeFilename = import_path2.default.basename(filename);
  const targetPath = import_path2.default.join(WORKSPACE_PATH, safeFilename);
  await import_promises.default.writeFile(targetPath, content, "utf8");
  let fmtOutput = "";
  let validateOutput = "";
  if (safeFilename.endsWith(".tf")) {
    try {
      const fmtRes = await execPromise("terraform fmt", { cwd: WORKSPACE_PATH });
      fmtOutput = fmtRes.stdout.trim();
    } catch {
    }
    try {
      const valRes = await execPromise("terraform validate", { cwd: WORKSPACE_PATH });
      validateOutput = valRes.stdout.trim();
    } catch (e) {
      validateOutput = e.stderr || e.stdout || e.message;
    }
  }
  return { path: targetPath, fmtOutput, validateOutput };
}
async function runTerraformCommand(action) {
  await ensureWorkspace();
  let cmd = "terraform fmt";
  if (action === "init") {
    cmd = "terraform init -backend=false";
  } else if (action === "validate") {
    cmd = "terraform validate";
  } else if (action === "plan") {
    cmd = "terraform plan -no-color";
  }
  try {
    const { stdout, stderr } = await execPromise(cmd, { cwd: WORKSPACE_PATH });
    return {
      success: true,
      output: (stdout + "\n" + (stderr || "")).trim()
    };
  } catch (error) {
    return {
      success: false,
      output: (error.stdout || "") + "\n" + (error.stderr || error.message)
    };
  }
}

// src/routes/chat.ts
async function chatRoutes(fastify2) {
  fastify2.get("/api/projects", async (request, reply) => {
    try {
      const userId = request.headers["x-user-id"] || request.query?.userId;
      const projects = getProjects(userId);
      return { projects };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch projects" });
    }
  });
  fastify2.post("/api/projects", async (request, reply) => {
    try {
      const userId = request.headers["x-user-id"] || request.body?.userId || "";
      const { name, description, icon } = request.body || {};
      if (!name) {
        return reply.status(400).send({ error: "Project name is required" });
      }
      const id = "proj-" + Date.now();
      const proj = createProject(id, name, description || "", icon || "\u{1F4C1}", userId);
      return proj;
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to create project" });
    }
  });
  fastify2.delete("/api/projects/:id", async (request, reply) => {
    try {
      const userId = request.headers["x-user-id"] || "";
      const { id } = request.params;
      deleteProject(id, userId);
      return { success: true };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to delete project" });
    }
  });
  fastify2.get("/api/projects/:id/members", async (request, reply) => {
    try {
      const { id } = request.params;
      const members = getProjectMembers(id);
      return { members };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch project members" });
    }
  });
  fastify2.post("/api/projects/:id/members", async (request, reply) => {
    try {
      const { id } = request.params;
      const { username, role } = request.body || {};
      if (!username) {
        return reply.status(400).send({ error: "Username is required to share project" });
      }
      const member = addProjectMember(id, username.trim(), role || "editor");
      return { success: true, member };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to add project member" });
    }
  });
  fastify2.delete("/api/projects/:id/members/:memberId", async (request, reply) => {
    try {
      const { id, memberId } = request.params;
      removeProjectMember(id, memberId);
      return { success: true };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to remove project member" });
    }
  });
  fastify2.get("/api/conversations", async (request, reply) => {
    try {
      const userId = request.headers["x-user-id"] || request.query?.userId;
      const { projectId } = request.query;
      const convos = getConversations(userId, projectId || void 0);
      return { conversations: convos };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch conversations" });
    }
  });
  fastify2.post("/api/conversations", async (request, reply) => {
    try {
      const userId = request.headers["x-user-id"] || request.body?.userId || "";
      const body = request.body || {};
      const id = body.id || (0, import_crypto2.randomUUID)();
      const title = body.title || "New Infrastructure Chat";
      const provider = body.provider || "ollama";
      const model = body.model || "";
      const projectId = body.projectId || "";
      const convo = createConversation(id, title, provider, model, projectId, userId);
      return convo;
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to create conversation" });
    }
  });
  fastify2.get("/api/conversations/:id/messages", async (request, reply) => {
    try {
      const { id } = request.params;
      const messages = getMessages(id);
      return { messages };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch messages" });
    }
  });
  fastify2.delete("/api/conversations/:id", async (request, reply) => {
    try {
      const userId = request.headers["x-user-id"] || "";
      const { id } = request.params;
      deleteConversation(id, userId);
      return { success: true };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to delete conversation" });
    }
  });
  fastify2.get("/api/models", async (request, reply) => {
    let ollamaOnline = false;
    let localModels = [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch("http://127.0.0.1:11434/api/tags", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        ollamaOnline = true;
        localModels = (data.models || []).map((m) => m.name);
      }
    } catch {
      ollamaOnline = false;
    }
    const settings = getAllSettings();
    const geminiKey = settings["gemini_api_key"] || process.env.GEMINI_API_KEY;
    const openaiKey = settings["openai_api_key"] || process.env.OPENAI_API_KEY;
    const anthropicKey = settings["anthropic_api_key"] || process.env.ANTHROPIC_API_KEY;
    const hasKeys = {
      gemini: Boolean(geminiKey),
      openai: Boolean(openaiKey),
      anthropic: Boolean(anthropicKey)
    };
    const cloudModels = [];
    if (geminiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, {
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models)) {
            const unsupportedKeywords = [
              "tts",
              "image",
              "imagen",
              "audio",
              "realtime",
              "embedding",
              "embed",
              "aqa",
              "retrieval",
              "computer-use",
              "whisper",
              "transcribe"
            ];
            const fetched = data.models.filter((m) => {
              if (!m || !m.name) return false;
              const name = String(m.name).replace(/^models\//, "").toLowerCase();
              if (!name.startsWith("gemini-")) return false;
              if (!Array.isArray(m.supportedGenerationMethods) || !m.supportedGenerationMethods.includes("generateContent")) {
                return false;
              }
              if (unsupportedKeywords.some((k) => name.includes(k))) {
                return false;
              }
              return true;
            }).map((m) => m.name.replace(/^models\//, ""));
            fetched.sort((a, b) => {
              const score = (name) => {
                if (name === "gemini-3.6-flash") return 100;
                if (name === "gemini-3-flash-preview") return 95;
                if (name === "gemini-flash-latest") return 90;
                if (name === "gemini-3.5-flash") return 80;
                if (name === "gemini-3.5-flash-lite") return 75;
                if (name === "gemini-3.1-pro-preview") return 70;
                if (name.includes("3.6")) return 85;
                if (name.includes("flash")) return 50;
                return 10;
              };
              return score(b) - score(a);
            });
            if (fetched.length > 0) {
              cloudModels.push(...fetched.slice(0, 15));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic Gemini models:", err);
      }
      if (!cloudModels.some((m) => m.startsWith("gemini"))) {
        cloudModels.push("gemini-3.6-flash", "gemini-3-flash-preview");
      }
    }
    if (openaiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${openaiKey}` },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data)) {
            const unsupported = [
              "realtime",
              "audio",
              "transcribe",
              "tts",
              "image",
              "dall-e",
              "embedding",
              "moderation",
              "search",
              "preview-audio"
            ];
            const fetched = data.data.map((m) => m.id).filter(
              (id) => {
                if (!id) return false;
                const lower = id.toLowerCase();
                if (!lower.startsWith("gpt-4") && !lower.startsWith("gpt-3.5") && !lower.startsWith("o1") && !lower.startsWith("o3") && !lower.startsWith("chatgpt-")) {
                  return false;
                }
                return !unsupported.some((u) => lower.includes(u));
              }
            ).sort();
            if (fetched.length > 0) {
              cloudModels.push(...fetched.slice(0, 10));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic OpenAI models:", err);
      }
      if (!cloudModels.some((m) => m.startsWith("gpt"))) {
        cloudModels.push("gpt-4o", "gpt-4o-mini");
      }
    }
    if (anthropicKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01"
          },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data)) {
            const fetched = data.data.map((m) => m.id).filter((id) => id && id.startsWith("claude-"));
            if (fetched.length > 0) {
              cloudModels.push(...fetched.slice(0, 8));
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic Anthropic models:", err);
      }
      if (!cloudModels.some((m) => m.startsWith("claude"))) {
        cloudModels.push("claude-3-5-sonnet-20241022");
      }
    }
    return {
      ollamaOnline,
      localModels,
      cloudModels,
      hasKeys
    };
  });
  fastify2.post("/api/models/ollama/pull", async (request, reply) => {
    try {
      const { model } = request.body || {};
      if (!model || !String(model).trim()) {
        return reply.status(400).send({ error: "Model name is required" });
      }
      const modelName = String(model).trim();
      reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
      reply.raw.setHeader("Connection", "keep-alive");
      const sendEvent = (data) => {
        reply.raw.write(`data: ${JSON.stringify(data)}

`);
      };
      sendEvent({ status: `Connecting to Ollama library for '${modelName}'...`, percent: 0 });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18e5);
      const res = await fetch("http://127.0.0.1:11434/api/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName, stream: true }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const errorText = await res.text();
        sendEvent({ error: errorText || `Ollama returned error (${res.status})` });
        reply.raw.write("data: [DONE]\n\n");
        reply.raw.end();
        return;
      }
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.error) {
                sendEvent({ error: parsed.error });
                continue;
              }
              let percent = 0;
              if (parsed.total && parsed.completed) {
                percent = Math.min(100, Math.round(parsed.completed / parsed.total * 100));
              }
              sendEvent({
                status: parsed.status || "Downloading...",
                total: parsed.total || 0,
                completed: parsed.completed || 0,
                percent,
                digest: parsed.digest || ""
              });
            } catch {
            }
          }
        }
      }
      sendEvent({ status: `Successfully downloaded '${modelName}'!`, percent: 100, success: true });
      reply.raw.write("data: [DONE]\n\n");
      reply.raw.end();
    } catch (err) {
      fastify2.log.error(err);
      reply.raw.write(`data: ${JSON.stringify({ error: err.message || "Error pulling Ollama model" })}

`);
      reply.raw.write("data: [DONE]\n\n");
      reply.raw.end();
    }
  });
  fastify2.delete("/api/models/ollama/:model", async (request, reply) => {
    try {
      const { model } = request.params;
      if (!model) {
        return reply.status(400).send({ error: "Model name is required" });
      }
      const decoded = decodeURIComponent(model).trim();
      const res = await fetch("http://127.0.0.1:11434/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: decoded })
      });
      if (res.ok) {
        return { success: true, message: `Model ${decoded} removed successfully` };
      } else {
        const errorText = await res.text();
        return reply.status(res.status).send({ error: errorText || "Failed to delete model from Ollama" });
      }
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: err.message || "Error deleting Ollama model" });
    }
  });
  fastify2.post("/api/chat", async (request, reply) => {
    const userId = request.headers["x-user-id"] || request.body?.userId || "";
    const reqBody = request.body || {};
    const {
      conversationId: incomingConvoId,
      projectId = "",
      messages: rawMessages,
      message: singleMessage,
      provider = "ollama",
      model = "",
      agentId = "agent_tf-devops-expert"
    } = reqBody;
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    const messages = Array.isArray(rawMessages) ? rawMessages : singleMessage ? [{ role: "user", content: String(singleMessage) }] : [];
    let conversationId = incomingConvoId;
    const latestUserMsg = messages[messages.length - 1];
    const rawContent = latestUserMsg?.content?.trim() || "Terraform Project";
    const cleanTitle = rawContent.split("\n")[0].replace(/[`#*]/g, "").trim().slice(0, 40) || "Terraform Chat";
    if (!conversationId) {
      conversationId = (0, import_crypto2.randomUUID)();
      createConversation(conversationId, cleanTitle, provider, model, projectId, userId);
    } else {
      const existing = getConversation(conversationId);
      if (!existing && latestUserMsg) {
        createConversation(conversationId, cleanTitle, provider, model, projectId, userId);
      }
    }
    if (latestUserMsg && latestUserMsg.role === "user") {
      addMessage((0, import_crypto2.randomUUID)(), conversationId, "user", latestUserMsg.content, userId);
    }
    let fullAssistantResponse = "";
    const streamToken = (token) => {
      fullAssistantResponse += token;
      reply.raw.write(`data: ${JSON.stringify({ content: token, conversationId })}

`);
    };
    const sendStatus = (status, phase = "processing") => {
      reply.raw.write(`data: ${JSON.stringify({ status, phase, conversationId })}

`);
    };
    sendStatus("Initializing conversation & agent context...", "init");
    let projectContext = void 0;
    if (projectId) {
      sendStatus("Loading project files & workspace context...", "context");
      try {
        const proj = getProjectById(projectId);
        const files = await listWorkspaceFiles();
        if (proj) {
          projectContext = {
            name: proj.name,
            description: proj.description,
            files: files.map((f) => ({ name: f.name, size: f.size, content: f.content }))
          };
        }
      } catch (e) {
        fastify2.log.warn({ err: e }, "Could not load project workspace files for agent context");
      }
    }
    const settings = getAllSettings();
    const systemPrompt = buildSystemPrompt(agentId, projectContext);
    const geminiKey = settings["gemini_api_key"] || process.env.GEMINI_API_KEY;
    const openaiKey = settings["openai_api_key"] || process.env.OPENAI_API_KEY;
    const anthropicKey = settings["anthropic_api_key"] || process.env.ANTHROPIC_API_KEY;
    const hasAnyCloudKey = Boolean(geminiKey || openaiKey || anthropicKey);
    let activeProvider = provider;
    if (activeProvider === "ollama") {
      sendStatus("Connecting to Ollama daemon (port 11434)...", "connecting");
      let ollamaActive = false;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2e3);
        const check = await fetch("http://127.0.0.1:11434/api/version", { signal: controller.signal });
        clearTimeout(timeout);
        ollamaActive = check.ok;
      } catch {
        ollamaActive = false;
      }
      if (!ollamaActive) {
        sendStatus("Attempting to launch local Ollama background service...", "starting");
        try {
          const { startOllamaDaemon: startOllamaDaemon2, isOllamaRunning: isOllamaRunning2 } = await Promise.resolve().then(() => (init_ollama(), ollama_exports));
          await startOllamaDaemon2();
          ollamaActive = await isOllamaRunning2();
        } catch {
        }
      }
      if (!ollamaActive) {
        streamToken(
          `> \u26A0\uFE0F **Ollama is offline or unreachable on port 11434.**

TerraMind could not connect to your local Ollama daemon. Please start it using:

\`\`\`bash
ollama serve
\`\`\`

Once started, send your message again. Or switch to **Cloud AI** in the model menu if you prefer.`
        );
        reply.raw.write(`data: [DONE]

`);
        reply.raw.end();
        return;
      }
      let targetModel = model;
      sendStatus("Verifying local model availability...", "resolving");
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2e3);
        const tagsRes = await fetch("http://127.0.0.1:11434/api/tags", { signal: controller.signal });
        clearTimeout(timeout);
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          const available = (tagsData.models || []).map((m) => m.name);
          if (available.length > 0) {
            if (!targetModel || !available.includes(targetModel)) {
              targetModel = available[0];
            }
          }
        }
      } catch (e) {
        fastify2.log.warn({ err: e }, "Could not query Ollama tags for model fallback");
      }
      if (!targetModel) {
        targetModel = "qwen2.5-coder:1.5b";
      }
      sendStatus(`Processing prompt with '${targetModel}'...`, "generating");
      try {
        const ollamaRes = await fetch("http://127.0.0.1:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: targetModel,
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            stream: true
          })
        });
        if (!ollamaRes.ok) {
          const errText = await ollamaRes.text();
          streamToken(
            `> \u26A0\uFE0F **Ollama Error (${ollamaRes.status}):**

${errText}

Make sure model \`${targetModel}\` is downloaded via \`ollama pull ${targetModel}\`.`
          );
        } else if (ollamaRes.body) {
          const reader = ollamaRes.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  streamToken(data.message.content);
                }
              } catch {
              }
            }
          }
        }
      } catch (err) {
        streamToken(`> \u26A0\uFE0F **Failed to stream from Ollama:** ${err.message}`);
      }
    }
    if (activeProvider === "cloud") {
      let targetModel = model;
      if (!targetModel || targetModel.startsWith("gemini") && !geminiKey || targetModel.startsWith("gpt") && !openaiKey || targetModel.startsWith("claude") && !anthropicKey) {
        if (geminiKey) targetModel = "gemini-3.6-flash";
        else if (openaiKey) targetModel = "gpt-4o";
        else if (anthropicKey) targetModel = "claude-3-5-sonnet-20241022";
        else targetModel = "gemini-3.6-flash";
      }
      const isGemini = targetModel.startsWith("gemini");
      const isAnthropic = targetModel.startsWith("claude");
      const isOpenAI = targetModel.startsWith("gpt") || targetModel.startsWith("o1") || targetModel.startsWith("o3");
      if (isGemini && !geminiKey) {
        streamToken(
          `> \u{1F511} **Gemini API Key Missing**

Please add your Google Gemini API key in **Settings > API Keys** (gear icon in sidebar or composer) to enable cloud generation with \`${targetModel}\`.`
        );
      } else if (isOpenAI && !openaiKey) {
        streamToken(
          `> \u{1F511} **OpenAI API Key Missing**

Please add your OpenAI API key in **Settings > API Keys** (gear icon in sidebar or composer) to enable cloud generation with \`${targetModel}\`.`
        );
      } else if (isAnthropic && !anthropicKey) {
        streamToken(
          `> \u{1F511} **Anthropic API Key Missing**

Please add your Anthropic API key in **Settings > API Keys** (gear icon in sidebar or composer) to enable cloud generation with \`${targetModel}\`.`
        );
      } else if (isGemini && geminiKey) {
        sendStatus(`Connecting to Google Gemini (${targetModel})...`, "connecting");
        const streamGemini = async (modelToUse, isFallback = false) => {
          try {
            sendStatus(`Generating response with Google Gemini (${modelToUse})...`, "generating");
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:streamGenerateContent?alt=sse&key=${geminiKey}`;
            const contents = messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }));
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents
              })
            });
            if (!res.ok) {
              const err = await res.text();
              if (!isFallback && (res.status === 503 || res.status === 429 || res.status === 404) && modelToUse !== "gemini-3.6-flash") {
                streamToken(
                  `> \u2139\uFE0F *Model \`${modelToUse}\` is temporarily unavailable (${res.status} High Demand). Automatically switching to stable \`gemini-3.6-flash\`...*

`
                );
                return await streamGemini("gemini-3.6-flash", true);
              }
              streamToken(`> \u26A0\uFE0F **Gemini Error (${res.status}):** ${err}`);
              return false;
            }
            if (res.body) {
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
                for (const line of lines) {
                  const raw = line.replace("data: ", "").trim();
                  try {
                    const data = JSON.parse(raw);
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) streamToken(text);
                  } catch {
                  }
                }
              }
              return true;
            }
            return false;
          } catch (e) {
            if (!isFallback && modelToUse !== "gemini-3.6-flash") {
              streamToken(
                `> \u2139\uFE0F *Connection to \`${modelToUse}\` failed. Automatically retrying with \`gemini-3.6-flash\`...*

`
              );
              return await streamGemini("gemini-3.6-flash", true);
            }
            streamToken(`> \u26A0\uFE0F **Gemini request failed:** ${e.message}`);
            return false;
          }
        };
        await streamGemini(targetModel);
      } else if (isOpenAI && openaiKey) {
        sendStatus(`Generating response with OpenAI (${targetModel})...`, "generating");
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: targetModel,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
              stream: true
            })
          });
          if (!res.ok) {
            const err = await res.text();
            let errMsg = err;
            try {
              const parsed = JSON.parse(err);
              if (parsed.error?.message) errMsg = parsed.error.message;
            } catch {
            }
            streamToken(`> \u26A0\uFE0F **OpenAI Error (${res.status}):**

${errMsg}

Please check or update your OpenAI API key in **Settings > API Keys**.`);
          } else if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let chunkBuffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunkBuffer += decoder.decode(value, { stream: true });
              const lines = chunkBuffer.split("\n");
              chunkBuffer = lines.pop() || "";
              for (const line of lines) {
                const raw = line.replace("data: ", "").trim();
                if (raw === "[DONE]") break;
                try {
                  const data = JSON.parse(raw);
                  const token = data.choices?.[0]?.delta?.content;
                  if (token) streamToken(token);
                } catch {
                }
              }
            }
          }
        } catch (e) {
          streamToken(`> \u26A0\uFE0F **OpenAI request failed:** ${e.message}`);
        }
      } else if (isAnthropic && anthropicKey) {
        sendStatus(`Generating response with Anthropic (${targetModel})...`, "generating");
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: targetModel,
              system: systemPrompt,
              messages: messages.map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
              })),
              max_tokens: 4096,
              stream: true
            })
          });
          if (!res.ok) {
            const err = await res.text();
            let errMsg = err;
            try {
              const parsed = JSON.parse(err);
              if (parsed.error?.message) errMsg = parsed.error.message;
            } catch {
            }
            streamToken(`> \u26A0\uFE0F **Anthropic Error (${res.status}):**

${errMsg}

Please check or update your Anthropic API key in **Settings > API Keys**.`);
          } else if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let chunkBuffer = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunkBuffer += decoder.decode(value, { stream: true });
              const lines = chunkBuffer.split("\n");
              chunkBuffer = lines.pop() || "";
              for (const line of lines) {
                const raw = line.replace("data: ", "").trim();
                try {
                  const data = JSON.parse(raw);
                  if (data.type === "content_block_delta" && data.delta?.text) {
                    streamToken(data.delta.text);
                  }
                } catch {
                }
              }
            }
          }
        } catch (e) {
          streamToken(`> \u26A0\uFE0F **Anthropic request failed:** ${e.message}`);
        }
      }
    }
    if (fullAssistantResponse.trim()) {
      addMessage((0, import_crypto2.randomUUID)(), conversationId, "assistant", fullAssistantResponse, userId);
    }
    reply.raw.write(`data: [DONE]

`);
    reply.raw.end();
  });
}

// src/routes/workspace.ts
init_ollama();
async function workspaceRoutes(fastify2) {
  fastify2.get("/api/workspace", async (request, reply) => {
    try {
      const files = await listWorkspaceFiles();
      const ollamaActive = await isOllamaRunning();
      return {
        path: WORKSPACE_PATH,
        files,
        ollamaActive
      };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to inspect workspace" });
    }
  });
  fastify2.post("/api/workspace/run", async (request, reply) => {
    const { action } = request.body;
    if (!action) {
      return reply.status(400).send({ error: "action is required (init, fmt, validate, plan)" });
    }
    try {
      const result = await runTerraformCommand(action);
      return result;
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to run Terraform action" });
    }
  });
  fastify2.post("/api/workspace/save", async (request, reply) => {
    const { filename, content } = request.body;
    if (!filename || content === void 0) {
      return reply.status(400).send({ error: "filename and content are required" });
    }
    try {
      const result = await writeWorkspaceFile(filename, content);
      return { success: true, ...result };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to save workspace file" });
    }
  });
  fastify2.post("/api/ollama/start", async (request, reply) => {
    try {
      const started = await startOllamaDaemon();
      return { online: started };
    } catch (err) {
      fastify2.log.error(err);
      return reply.status(500).send({ error: "Failed to start Ollama server" });
    }
  });
}

// src/routes/auth.ts
var import_crypto3 = require("crypto");
function hashPassword(password) {
  return (0, import_crypto3.createHash)("sha256").update(password).digest("hex");
}
async function authAndSettingsRoutes(fastify2) {
  fastify2.get("/api/auth/status", async (request, reply) => {
    const totalUsers = getUserCount();
    return {
      requiresSetup: totalUsers === 0
    };
  });
  fastify2.post("/api/auth/login", async (request, reply) => {
    const { username, password } = request.body || {};
    if (!username || !password) {
      return reply.status(400).send({ error: "Username and password are required" });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return reply.status(401).send({ error: "Invalid username or password" });
    }
    if (user.password_hash !== hashPassword(password)) {
      return reply.status(401).send({ error: "Invalid username or password" });
    }
    const sessionToken = (0, import_crypto3.randomUUID)();
    recordUserSession(user.id, user.username, sessionToken);
    logUserActivity(user.id, "user_logged_in", { username: user.username });
    return {
      success: true,
      token: sessionToken,
      user: { id: user.id, username: user.username }
    };
  });
  fastify2.post("/api/auth/register", async (request, reply) => {
    const { username, password } = request.body || {};
    if (!username || !password || password.length < 4) {
      return reply.status(400).send({ error: "Username and password (min 4 chars) are required" });
    }
    const existing = getUserByUsername(username);
    if (existing) {
      return reply.status(400).send({ error: "Username already exists" });
    }
    const newUser = createUser((0, import_crypto3.randomUUID)(), username, hashPassword(password));
    const sessionToken = (0, import_crypto3.randomUUID)();
    recordUserSession(newUser.id, newUser.username, sessionToken);
    return {
      success: true,
      token: sessionToken,
      user: newUser
    };
  });
  fastify2.post("/api/auth/sso", async (request, reply) => {
    try {
      const { provider = "sso", email, name } = request.body || {};
      const username = email || (name ? `${name.toLowerCase().replace(/\s+/g, "_")}_${provider.toLowerCase()}` : `${provider.toLowerCase()}_user`);
      let user = getUserByUsername(username);
      if (!user) {
        user = createUser((0, import_crypto3.randomUUID)(), username, hashPassword(`sso_${provider}_${(0, import_crypto3.randomUUID)()}`));
      }
      const sessionToken = (0, import_crypto3.randomUUID)();
      recordUserSession(user.id, user.username, sessionToken);
      logUserActivity(user.id, "sso_login", { provider, username: user.username });
      return {
        success: true,
        token: sessionToken,
        user: { id: user.id, username: user.username, provider }
      };
    } catch (e) {
      fastify2.log.error(e);
      return reply.status(500).send({ error: "SSO authentication failed" });
    }
  });
  fastify2.get("/api/settings", async (request, reply) => {
    const settings = getAllSettings();
    return {
      openaiApiKey: settings["openai_api_key"] ? maskKey(settings["openai_api_key"]) : "",
      geminiApiKey: settings["gemini_api_key"] ? maskKey(settings["gemini_api_key"]) : "",
      anthropicApiKey: settings["anthropic_api_key"] ? maskKey(settings["anthropic_api_key"]) : "",
      hasOpenaiKey: Boolean(settings["openai_api_key"] || process.env.OPENAI_API_KEY),
      hasGeminiKey: Boolean(settings["gemini_api_key"] || process.env.GEMINI_API_KEY),
      hasAnthropicKey: Boolean(settings["anthropic_api_key"] || process.env.ANTHROPIC_API_KEY)
    };
  });
  fastify2.post("/api/settings", async (request, reply) => {
    const body = request.body || {};
    if (body.openaiApiKey !== void 0 && !body.openaiApiKey.includes("\u2022\u2022\u2022\u2022")) {
      setSetting("openai_api_key", body.openaiApiKey.trim());
    }
    if (body.geminiApiKey !== void 0 && !body.geminiApiKey.includes("\u2022\u2022\u2022\u2022")) {
      setSetting("gemini_api_key", body.geminiApiKey.trim());
    }
    if (body.anthropicApiKey !== void 0 && !body.anthropicApiKey.includes("\u2022\u2022\u2022\u2022")) {
      setSetting("anthropic_api_key", body.anthropicApiKey.trim());
    }
    return { success: true };
  });
  fastify2.delete("/api/settings/keys/:provider", async (request, reply) => {
    const { provider } = request.params;
    const p = String(provider).toLowerCase();
    if (p === "openai") setSetting("openai_api_key", "");
    else if (p === "gemini") setSetting("gemini_api_key", "");
    else if (p === "anthropic") setSetting("anthropic_api_key", "");
    return { success: true };
  });
}
function maskKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  return key.slice(0, 4) + "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + key.slice(-4);
}

// src/server.ts
var server = (0, import_fastify.default)({ logger: true });
server.register(chatRoutes);
server.register(workspaceRoutes);
server.register(authAndSettingsRoutes);
server.get("/health", async (request, reply) => {
  return { status: "ok" };
});
var webDistPath = import_path3.default.resolve(__dirname, "../../web/dist");
if (import_fs.default.existsSync(webDistPath)) {
  server.register(import_static.default, {
    root: webDistPath,
    prefix: "/"
  });
  server.setNotFoundHandler((request, reply) => {
    if (request.raw.url && request.raw.url.startsWith("/api")) {
      reply.status(404).send({ error: "API route not found" });
    } else {
      reply.sendFile("index.html");
    }
  });
}
var start = async () => {
  try {
    console.log("Database initialized in WAL mode");
    const port = Number(process.env.PORT) || 3080;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`TerraMind Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
