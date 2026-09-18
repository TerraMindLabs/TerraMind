require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TerraMind";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("[MongoDB] Connected to TerraMind database.");
    const database = client.db("TerraMind");
    const agentsCollection = database.collection("agents");
    const aclEntriesCollection = database.collection("acl_entries");
    const usersCollection = database.collection("users");

    // Fetch existing users
    const users = await usersCollection.find({}).toArray();
    const primaryUser = users.length > 0 ? users[0]._id : new ObjectId("000000000000000000000000");

    const FIXED_AGENT_ID = "agent_tf-devops-expert";

    const terraformAgent = {
      id: FIXED_AGENT_ID,
      name: "Terraform DevOps Expert",
      description: "Automates Terraform infrastructure creation, validation, and deployment.",
      instructions: "You are a DevOps automation expert specializing in Terraform. You have access to three custom tools:\n\n1. `terraform-registry`: Use this to look up providers, read their documentation, and find correct resource syntaxes.\n2. `local-fs`: Use this to read, write, and modify the user's local .tf files inside their workspace.\n3. `tf-runner`: Use this to actually execute `terraform init`, `terraform plan`, `terraform apply`, etc. on their machine.\n\nYour goal is to guide the user from infrastructure request to fully deployed code. Always read the local files first to understand the existing state before making changes.",
      provider: process.env.AGENT_PROVIDER || "google",
      model: process.env.AGENT_MODEL || "gemini-3.5-flash-lite",
      model_parameters: {},
      mcpServerNames: ["terraform-registry", "local-fs", "tf-runner"],
      tools: ["terraform-registry", "local-fs", "tf-runner"],
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if it already exists
    const existing = await agentsCollection.findOne({ name: "Terraform DevOps Expert" });
    let finalObjectId;
    let finalId = FIXED_AGENT_ID;

    if (existing) {
      console.log("[MongoDB] Agent 'Terraform DevOps Expert' already exists. Synchronizing properties.");
      finalObjectId = existing._id;
      await agentsCollection.updateOne(
        { _id: finalObjectId },
        {
          $set: {
            id: FIXED_AGENT_ID,
            provider: terraformAgent.provider,
            model: terraformAgent.model,
            avatar: terraformAgent.avatar,
            support_contact: terraformAgent.support_contact,
            mcpServerNames: terraformAgent.mcpServerNames,
            tools: terraformAgent.tools,
            projectIds: ["default", "global"],
            is_promoted: true,
            updatedAt: new Date()
          }
        }
      );
    } else {
      const result = await agentsCollection.insertOne(terraformAgent);
      console.log(`[MongoDB] Successfully seeded 'Terraform DevOps Expert' agent with _id: ${result.insertedId}`);
      finalObjectId = result.insertedId;
    }

    // Update any existing conversations pointing to the old agent ID
    const convosCollection = database.collection("conversations");
    await convosCollection.updateMany(
      { $or: [{ agent_id: { $regex: /^tf-expert-/ } }, { agent_id: { $regex: /^agent_tf-/ } }, { agent_id: FIXED_AGENT_ID }] },
      { $set: { agent_id: FIXED_AGENT_ID, model: terraformAgent.model, endpoint: 'agents' } }
    );

    // Update both aclentries (Mongoose default) and acl_entries
    const targetCollections = ['aclentries', 'acl_entries'];
    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({
        $or: [
          { resourceId: finalObjectId },
          { resourceId: finalId },
          { resourceId: finalObjectId.toString() }
        ]
      });

      const aclEntries = [];

      // 1. PUBLIC access entry (lowercase 'public', lowercase 'agent', resourceId as ObjectId, permBits: 1 for VIEW)
      aclEntries.push({
        principalType: 'public',
        principalId: null,
        resourceType: 'agent',
        resourceId: finalObjectId,
        permBits: 1,
        grantedBy: primaryUser,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 2. Grant explicit user-level permissions to all existing users
      for (const u of users) {
        aclEntries.push({
          principalType: 'user',
          principalId: u._id,
          principalModel: 'User',
          resourceType: 'agent',
          resourceId: finalObjectId,
          permBits: 15, // VIEW | EDIT | DELETE | SHARE
          grantedBy: u._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        aclEntries.push({
          principalType: 'user',
          principalId: u._id,
          principalModel: 'User',
          resourceType: 'remoteAgent',
          resourceId: finalObjectId,
          permBits: 15,
          grantedBy: u._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await col.insertMany(aclEntries);
      console.log(`[MongoDB] Successfully inserted ${aclEntries.length} ACL entries into ${colName}.`);
    }

    // ─── FinOps & Cloud Cost Optimizer ───────────────────────────────────────
    const FINOPS_ID = "agent_finops-cost-optimizer";
    const finopsAgent = {
      id: FINOPS_ID,
      name: "FinOps & Cloud Cost Optimizer",
      description: "Analyzes .tf files, calculates monthly cost estimates, and recommends rightsizing (Spot, Graviton, auto-scaling).",
      instructions: "You are a FinOps and cloud cost optimization expert. You have access to two custom tools:\n\n1. `local-fs`: Use this to read the user's local .tf files and understand their infrastructure setup.\n2. `terraform-registry`: Use this to look up provider documentation, resource pricing, and instance specifications.\n\nYour goal is to analyze Terraform infrastructure code, estimate monthly cloud costs, identify over-provisioned resources, and recommend cost-saving strategies such as Spot/Preemptible instances, Graviton/ARM processors, Reserved Instances, and auto-scaling configurations. Always read local files first before making recommendations.",
      provider: process.env.AGENT_PROVIDER || "google",
      model: process.env.AGENT_MODEL || "gemini-3.5-flash-lite",
      model_parameters: {},
      mcpServerNames: ["local-fs", "terraform-registry"],
      tools: ["local-fs", "terraform-registry"],
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingFinops = await agentsCollection.findOne({ name: "FinOps & Cloud Cost Optimizer" });
    let finopsObjectId;
    if (existingFinops) {
      console.log("[MongoDB] Agent 'FinOps & Cloud Cost Optimizer' already exists. Synchronizing properties.");
      finopsObjectId = existingFinops._id;
      await agentsCollection.updateOne(
        { _id: finopsObjectId },
        { $set: { id: FINOPS_ID, provider: finopsAgent.provider, model: finopsAgent.model, avatar: finopsAgent.avatar, support_contact: finopsAgent.support_contact, mcpServerNames: finopsAgent.mcpServerNames, tools: finopsAgent.tools, projectIds: ["default", "global"], is_promoted: true, updatedAt: new Date() } }
      );
    } else {
      const r = await agentsCollection.insertOne(finopsAgent);
      finopsObjectId = r.insertedId;
      console.log(`[MongoDB] Successfully seeded 'FinOps & Cloud Cost Optimizer' agent with _id: ${finopsObjectId}`);
    }

    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({ $or: [{ resourceId: finopsObjectId }, { resourceId: FINOPS_ID }, { resourceId: finopsObjectId.toString() }] });
      const aclEntries = [
        { principalType: 'public', principalId: null, resourceType: 'agent', resourceId: finopsObjectId, permBits: 1, grantedBy: primaryUser, createdAt: new Date(), updatedAt: new Date() },
        ...users.flatMap(u => [
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'agent', resourceId: finopsObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'remoteAgent', resourceId: finopsObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
        ])
      ];
      await col.insertMany(aclEntries);
      console.log(`[MongoDB] Inserted ${aclEntries.length} ACL entries for FinOps agent into ${colName}.`);
    }

    // ─── Kubernetes & GitOps Platform Engineer ────────────────────────────────
    const K8S_ID = "agent_k8s-gitops-architect";
    const k8sAgent = {
      id: K8S_ID,
      name: "Kubernetes & GitOps Platform Engineer",
      description: "Generates production K8s manifests, Helm charts (values.yaml, templates), and ArgoCD/Flux GitOps rollouts.",
      instructions: "You are a Kubernetes and GitOps platform engineering expert. You have access to one custom tool:\n\n1. `local-fs`: Use this to read, write, and modify the user's local Kubernetes manifests, Helm chart files, and GitOps configuration files.\n\nYour goal is to generate production-grade Kubernetes YAML manifests, Helm chart structures (Chart.yaml, values.yaml, templates/), ArgoCD Application manifests, and Flux GitRepository/Kustomization resources. Follow GitOps best practices: declarative configuration, immutable container images, health checks, resource limits, and RBAC. Always inspect existing files before creating new ones to avoid conflicts.",
      provider: process.env.AGENT_PROVIDER || "google",
      model: process.env.AGENT_MODEL || "gemini-3.5-flash-lite",
      model_parameters: {},
      mcpServerNames: ["local-fs"],
      tools: ["local-fs"],
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingK8s = await agentsCollection.findOne({ name: "Kubernetes & GitOps Platform Engineer" });
    let k8sObjectId;
    if (existingK8s) {
      console.log("[MongoDB] Agent 'Kubernetes & GitOps Platform Engineer' already exists. Synchronizing properties.");
      k8sObjectId = existingK8s._id;
      await agentsCollection.updateOne(
        { _id: k8sObjectId },
        { $set: { id: K8S_ID, provider: k8sAgent.provider, model: k8sAgent.model, avatar: k8sAgent.avatar, support_contact: k8sAgent.support_contact, mcpServerNames: k8sAgent.mcpServerNames, tools: k8sAgent.tools, projectIds: ["default", "global"], is_promoted: true, updatedAt: new Date() } }
      );
    } else {
      const r = await agentsCollection.insertOne(k8sAgent);
      k8sObjectId = r.insertedId;
      console.log(`[MongoDB] Successfully seeded 'Kubernetes & GitOps Platform Engineer' agent with _id: ${k8sObjectId}`);
    }

    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({ $or: [{ resourceId: k8sObjectId }, { resourceId: K8S_ID }, { resourceId: k8sObjectId.toString() }] });
      const aclEntries = [
        { principalType: 'public', principalId: null, resourceType: 'agent', resourceId: k8sObjectId, permBits: 1, grantedBy: primaryUser, createdAt: new Date(), updatedAt: new Date() },
        ...users.flatMap(u => [
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'agent', resourceId: k8sObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'remoteAgent', resourceId: k8sObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
        ])
      ];
      await col.insertMany(aclEntries);
      console.log(`[MongoDB] Inserted ${aclEntries.length} ACL entries for K8s agent into ${colName}.`);
    }

    // ─── CI/CD Pipeline Engineer ──────────────────────────────────────────────
    const CICD_ID = "agent_cicd-pipeline-engineer";
    const cicdAgent = {
      id: CICD_ID,
      name: "CI/CD Pipeline Engineer",
      description: "Writes automated pipelines (GitHub Actions, GitLab CI) with state locking, automated PR plan comments, and security gates.",
      instructions: "You are a CI/CD pipeline engineering expert specializing in GitHub Actions and GitLab CI/CD. You have access to one custom tool:\n\n1. `local-fs`: Use this to read, write, and modify the user's local pipeline configuration files (.github/workflows/*.yml, .gitlab-ci.yml, etc.).\n\nYour goal is to design and implement production-ready CI/CD pipelines including: automated test runs, Terraform plan/apply with state locking, automated PR comments with plan output, security scanning gates (SAST, dependency checks), Docker build and push, deployment workflows, and environment-specific approvals. Always read existing workflow files before creating new ones to understand the repository structure.",
      provider: process.env.AGENT_PROVIDER || "google",
      model: process.env.AGENT_MODEL || "gemini-3.5-flash-lite",
      model_parameters: {},
      mcpServerNames: ["local-fs"],
      tools: ["local-fs"],
      is_promoted: true,
      avatar: { filepath: "/assets/only_logo.png" },
      support_contact: { name: "TerraMind" },
      projectIds: ["default", "global"],
      author: primaryUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingCicd = await agentsCollection.findOne({ name: "CI/CD Pipeline Engineer" });
    let cicdObjectId;
    if (existingCicd) {
      console.log("[MongoDB] Agent 'CI/CD Pipeline Engineer' already exists. Synchronizing properties.");
      cicdObjectId = existingCicd._id;
      await agentsCollection.updateOne(
        { _id: cicdObjectId },
        { $set: { id: CICD_ID, provider: cicdAgent.provider, model: cicdAgent.model, avatar: cicdAgent.avatar, support_contact: cicdAgent.support_contact, mcpServerNames: cicdAgent.mcpServerNames, tools: cicdAgent.tools, projectIds: ["default", "global"], is_promoted: true, updatedAt: new Date() } }
      );
    } else {
      const r = await agentsCollection.insertOne(cicdAgent);
      cicdObjectId = r.insertedId;
      console.log(`[MongoDB] Successfully seeded 'CI/CD Pipeline Engineer' agent with _id: ${cicdObjectId}`);
    }

    for (const colName of targetCollections) {
      const col = database.collection(colName);
      await col.deleteMany({ $or: [{ resourceId: cicdObjectId }, { resourceId: CICD_ID }, { resourceId: cicdObjectId.toString() }] });
      const aclEntries = [
        { principalType: 'public', principalId: null, resourceType: 'agent', resourceId: cicdObjectId, permBits: 1, grantedBy: primaryUser, createdAt: new Date(), updatedAt: new Date() },
        ...users.flatMap(u => [
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'agent', resourceId: cicdObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
          { principalType: 'user', principalId: u._id, principalModel: 'User', resourceType: 'remoteAgent', resourceId: cicdObjectId, permBits: 15, grantedBy: u._id, createdAt: new Date(), updatedAt: new Date() },
        ])
      ];
      await col.insertMany(aclEntries);
      console.log(`[MongoDB] Inserted ${aclEntries.length} ACL entries for CI/CD agent into ${colName}.`);
    }

    // 3. Ensure both ADMIN and USER roles have Marketplace and Agents permissions enabled
    const rolesCollection = database.collection("roles");
    for (const roleName of ["ADMIN", "USER"]) {
      await rolesCollection.updateOne(
        { name: roleName },
        {
          $set: {
            "permissions.marketplace.USE": true,
            "permissions.marketplace.use": true,
            "permissions.agents.USE": true,
            "permissions.agents.use": true,
          },
          $setOnInsert: {
            name: roleName,
            description: "",
          }
        },
        { upsert: true }
      );
    }
    await rolesCollection.updateMany(
      {},
      {
        $set: {
          "permissions.marketplace.USE": true,
          "permissions.marketplace.use": true,
          "permissions.agents.USE": true,
          "permissions.agents.use": true,
        }
      }
    );
    console.log("[MongoDB] Ensured marketplace and agents permissions are active for ADMIN, USER, and all roles.");

  } catch (error) {
    console.error("[MongoDB] Error seeding agent (Is MongoDB running?):", error.message);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
