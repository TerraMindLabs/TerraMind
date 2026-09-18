#!/usr/bin/env node
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/TerraMind';

async function wipeDatabase() {
  console.log(`[TerraMind] Connecting to MongoDB at ${uri}...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();

    // Parse database name from URI or default to TerraMind
    let dbName = 'TerraMind';
    try {
      const parsed = new URL(uri.replace('mongodb://', 'http://').replace('mongodb+srv://', 'http://'));
      if (parsed.pathname && parsed.pathname.length > 1) {
        dbName = parsed.pathname.replace(/^\//, '');
      }
    } catch {
      // Keep default dbName
    }

    const db = client.db(dbName);
    console.log(`[TerraMind] Dropping database '${dbName}' to clear all user, chat, and session data...`);
    await db.dropDatabase();
    console.log(`[TerraMind] ✅ Database '${dbName}' dropped successfully!`);

    console.log(`[TerraMind] Re-seeding TerraMind AI Agent...`);
    await client.close();

    // Execute seed-agent.js if present
    const seedScriptPath = path.resolve(__dirname, '..', 'seed-agent.js');
    if (require('fs').existsSync(seedScriptPath)) {
      require(seedScriptPath);
    }
  } catch (err) {
    console.error(`[TerraMind] ❌ Error resetting database:`, err.message);
    try { await client.close(); } catch {}
    process.exit(1);
  }
}

wipeDatabase();
