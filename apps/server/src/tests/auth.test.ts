import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';

const testDbFile = path.join(os.tmpdir(), `terramind_auth_test_${randomUUID()}.db`);
process.env.DB_PATH = testDbFile;

describe('Authentication & User Security Tests', async () => {
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

  test('1. createUser hashes password securely and never stores plaintext', () => {
    const rawPassword = 'SuperSecretDevOpsPassword!2026';
    const hash = dbModule.hashPassword(rawPassword);
    const user = dbModule.createUser('architect_lead', hash);

    assert.ok(user.id);
    assert.equal(user.username, 'architect_lead');

    // Verify raw password was never stored
    const stored = dbModule.getUserByUsername('architect_lead');
    assert.ok(stored);
    assert.notEqual(stored.password_hash, rawPassword);
    assert.match(stored.password_hash, /^[0-9a-f]{64}$/i, 'Password hash format must be valid 256-bit hex hash');
  });

  test('2. verifyUser succeeds with correct password and fails with invalid password', () => {
    const valid = dbModule.verifyUser('architect_lead', 'SuperSecretDevOpsPassword!2026');
    assert.ok(valid, 'Should authenticate with valid password');
    assert.equal(valid.username, 'architect_lead');

    const invalid = dbModule.verifyUser('architect_lead', 'WrongPassword123');
    assert.equal(invalid, null, 'Should reject invalid password');

    const nonExistent = dbModule.verifyUser('non_existent_user', 'anyPassword');
    assert.equal(nonExistent, null, 'Should reject non-existent user');
  });
});
