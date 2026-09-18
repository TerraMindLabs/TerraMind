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
