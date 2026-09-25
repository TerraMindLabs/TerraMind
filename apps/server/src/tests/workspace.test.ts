import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';

describe('Workspace File Security & Generation Tests', async () => {
  let terraformModule: typeof import('../services/terraform');
  let testWorkspaceDir: string;

  before(async () => {
    testWorkspaceDir = path.join(os.tmpdir(), `terramind_ws_test_${randomUUID()}`);
    fs.mkdirSync(testWorkspaceDir, { recursive: true });
    process.env.WORKSPACE_DIR = testWorkspaceDir;
    terraformModule = await import('../services/terraform');
  });

  after(() => {
    try {
      if (fs.existsSync(testWorkspaceDir)) {
        fs.rmSync(testWorkspaceDir, { recursive: true, force: true });
      }
    } catch {}
  });

  test('1. Security: Rejects directory traversal attempts (../ and ..\\)', async () => {
    const maliciousPaths = [
      '../../etc/passwd',
      '..\\..\\Windows\\System32\\cmd.exe',
      'subfolder/../../../sensitive.env',
      '../../escape.tf'
    ];

    for (const badPath of maliciousPaths) {
      await assert.rejects(
        async () => {
          await terraformModule.writeWorkspaceFile(badPath, 'content');
        },
        /Access denied: target path escapes workspace/,
        `Should reject traversal path: ${badPath}`
      );
    }
  });

  test('2. File creation in subfolder recursively creates directories', async () => {
    const relFile = 'k8s-production/deployments/app.yaml';
    const content = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: test-app';

    const result = await terraformModule.writeWorkspaceFile(relFile, content);
    assert.ok(result.path);
    assert.ok(fs.existsSync(result.path));

    const savedContent = fs.readFileSync(result.path, 'utf8');
    assert.equal(savedContent, content);
  });

  test('3. listWorkspaceFiles enumerates created files', async () => {
    await terraformModule.writeWorkspaceFile('test-module/main.tf', 'resource "null_resource" "init" {}');
    await terraformModule.writeWorkspaceFile('test-module/variables.tf', 'variable "env" { default = "dev" }');

    const files = await terraformModule.listWorkspaceFiles();
    assert.ok(files.length >= 2);
    assert.ok(files.some(f => f.name.includes('main.tf')));
    assert.ok(files.some(f => f.name.includes('variables.tf')));
  });
});
