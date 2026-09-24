import { MongoClient, Db } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/TerraMind';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

export async function initMongo(): Promise<boolean> {
  if (isConnected && db) return true;
  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 3000
    });
    await client.connect();
    db = client.db();
    isConnected = true;
    console.log('[MongoDB] Connected to database at', MONGO_URI);

    // Create indexes gracefully
    try {
      await db.collection('conversations').createIndex({ user_id: 1, created_at: -1 });
      await db.collection('conversations').createIndex({ id: 1 }, { sparse: true });
      await db.collection('messages').createIndex({ conversation_id: 1, created_at: 1 });
      await db.collection('sessions').createIndex({ token: 1 });
      await db.collection('activities').createIndex({ user_id: 1, created_at: -1 });
    } catch (e: any) {
      console.warn('[MongoDB] Index creation note:', e.message);
    }

    return true;
  } catch (err: any) {
    console.warn('[MongoDB] Connection failed, using SQLite fallback:', err.message);
    isConnected = false;
    return false;
  }
}

export function isMongoActive(): boolean {
  return isConnected && db !== null;
}

// Per-user session tracking
export async function recordUserSession(userId: string, username: string, token: string): Promise<void> {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection('sessions').insertOne({
      user_id: userId,
      username,
      token,
      login_at: new Date(),
      last_active: new Date()
    });
  } catch (e) {
    console.error('[MongoDB] Error recording session:', e);
  }
}

// Activity tracking
export async function logUserActivity(userId: string, action: string, metadata: Record<string, any> = {}): Promise<void> {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection('activities').insertOne({
      user_id: userId,
      action,
      metadata,
      created_at: new Date()
    });
  } catch (e) {
    console.error('[MongoDB] Error logging activity:', e);
  }
}

// Conversation syncing
export async function syncMongoConversation(convo: {
  id: string;
  user_id?: string;
  title: string;
  provider: string;
  model: string;
  project_id?: string;
  created_at: string;
}): Promise<void> {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection('conversations').updateOne(
      { id: convo.id },
      {
        $set: {
          ...convo,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );
  } catch (e) {
    console.error('[MongoDB] Error syncing conversation:', e);
  }
}

export async function syncMongoMessage(msg: {
  id: string;
  conversation_id: string;
  user_id?: string;
  role: string;
  content: string;
  created_at: string;
}): Promise<void> {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection('messages').updateOne(
      { id: msg.id },
      { $set: msg },
      { upsert: true }
    );
  } catch (e) {
    console.error('[MongoDB] Error syncing message:', e);
  }
}

export async function deleteMongoConversation(convoId: string): Promise<void> {
  if (!isMongoActive() || !db) return;
  try {
    await db.collection('conversations').deleteOne({ id: convoId });
    await db.collection('messages').deleteMany({ conversation_id: convoId });
  } catch (e) {
    console.error('[MongoDB] Error deleting conversation from mongo:', e);
  }
}
