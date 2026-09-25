import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';

// Use an isolated temporary SQLite database for tests
const testDbFile = path.join(os.tmpdir(), `terramind_db_test_${randomUUID()}.db`);
process.env.DB_PATH = testDbFile;

describe('Database & Message Persistence Tests', async () => {
  let dbModule: typeof import('../db');

  before(async () => {
    dbModule = await import('../db');
  });

  after(() => {
    try {
      if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
      if (fs.existsSync(testDbFile + '-wal')) fs.unlinkSync(testDbFile + '-wal');
      if (fs.existsSync(testDbFile + '-shm')) fs.unlinkSync(testDbFile + '-shm');
    } catch {}
  });

  test('1. createConversation and getConversation', () => {
    const convoId = randomUUID();
    const convo = dbModule.createConversation(
      convoId,
      'Test Production Infrastructure',
      'ollama',
      'qwen2.5-coder:7b',
      'proj_123',
      'user_test',
      'agent_tf-devops-expert'
    );

    assert.equal(convo.id, convoId);
    assert.equal(convo.title, 'Test Production Infrastructure');
    assert.equal(convo.agent_id, 'agent_tf-devops-expert');

    const fetched = dbModule.getConversation(convoId);
    assert.ok(fetched);
    assert.equal(fetched.id, convoId);
  });

  test('2. addMessage saves user and initial assistant messages', () => {
    const convoId = randomUUID();
    dbModule.createConversation(convoId, 'Chat Test', 'ollama', 'qwen2.5-coder:7b');

    const userMsg = dbModule.addMessage(randomUUID(), convoId, 'user', 'Deploy EKS cluster');
    assert.equal(userMsg.role, 'user');
    assert.equal(userMsg.content, 'Deploy EKS cluster');

    const messages = dbModule.getMessages(convoId);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].role, 'user');
  });

  test('3. upsertMessage updates streaming assistant message incrementally without duplication', () => {
    const convoId = randomUUID();
    dbModule.createConversation(convoId, 'Streaming Chat', 'ollama', 'qwen2.5-coder:7b');

    const assistantMsgId = randomUUID();

    // Chunk 1: Initial token stream
    dbModule.upsertMessage(assistantMsgId, convoId, 'assistant', 'Here is the EKS configuration:');
    let messages = dbModule.getMessages(convoId);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].content, 'Here is the EKS configuration:');

    // Chunk 2: More tokens streamed
    dbModule.upsertMessage(assistantMsgId, convoId, 'assistant', 'Here is the EKS configuration:\n```hcl\nresource "aws_eks_cluster"');
    messages = dbModule.getMessages(convoId);
    assert.equal(messages.length, 1, 'Should NOT create a duplicate message row');
    assert.equal(messages[0].content, 'Here is the EKS configuration:\n```hcl\nresource "aws_eks_cluster"');

    // Chunk 3: Final complete message
    const fullContent = 'Here is the EKS configuration:\n```hcl\nresource "aws_eks_cluster" "main" {}\n```';
    dbModule.upsertMessage(assistantMsgId, convoId, 'assistant', fullContent);
    messages = dbModule.getMessages(convoId);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].content, fullContent);
  });

  test('4. getMessages returns messages in chronological order (created_at ASC)', () => {
    const convoId = randomUUID();
    dbModule.createConversation(convoId, 'Ordering Test', 'ollama', 'qwen2.5-coder:7b');

    dbModule.addMessage(randomUUID(), convoId, 'user', 'Message 1');
    dbModule.addMessage(randomUUID(), convoId, 'assistant', 'Response 1');
    dbModule.addMessage(randomUUID(), convoId, 'user', 'Message 2');
    dbModule.addMessage(randomUUID(), convoId, 'assistant', 'Response 2');

    const messages = dbModule.getMessages(convoId);
    assert.equal(messages.length, 4);
    assert.equal(messages[0].role, 'user');
    assert.equal(messages[1].role, 'assistant');
    assert.equal(messages[2].role, 'user');
    assert.equal(messages[3].role, 'assistant');
  });

  test('5. deleteConversation cascades and deletes all associated messages', () => {
    const convoId = randomUUID();
    dbModule.createConversation(convoId, 'To Delete', 'ollama', 'qwen2.5-coder:7b');
    dbModule.addMessage(randomUUID(), convoId, 'user', 'Hello');
    dbModule.addMessage(randomUUID(), convoId, 'assistant', 'World');

    assert.equal(dbModule.getMessages(convoId).length, 2);

    dbModule.deleteConversation(convoId);

    assert.equal(dbModule.getConversation(convoId), undefined);
    assert.equal(dbModule.getMessages(convoId).length, 0);
  });
});
