import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';

const testDbFile = path.join(os.tmpdir(), `terramind_mcp_test_${randomUUID()}.db`);
process.env.DB_PATH = testDbFile;

describe('Model Context Protocol (MCP) Database & Management Tests', async () => {
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

  test('1. Default MCP catalog is pre-seeded on initialization', () => {
    const servers = dbModule.getAllMcpServers();
    assert.ok(servers.length >= 4, 'Should pre-seed at least 4 default MCP servers');

    const tfMcp = servers.find((s) => s.id === 'terraform-registry');
    assert.ok(tfMcp, 'Terraform Registry MCP must exist');
    assert.equal(tfMcp.transport, 'stdio');
    assert.equal(tfMcp.enabled, true);
    assert.ok(tfMcp.tools.length >= 2, 'Should provide standard tools');
    assert.ok(tfMcp.tools.some((t) => t.name === 'search_modules'));

    const k8sMcp = servers.find((s) => s.id === 'k8s-cluster-inspector');
    assert.ok(k8sMcp, 'Kubernetes MCP must exist');
  });

  test('2. getActiveMcpServers returns only enabled and active servers', () => {
    const active = dbModule.getActiveMcpServers();
    assert.ok(active.length > 0);
    for (const server of active) {
      assert.equal(server.enabled, true);
      assert.equal(server.status, 'active');
    }
  });

  test('3. toggleMcpServer enables and disables an MCP server', () => {
    const toggledOff = dbModule.toggleMcpServer('terraform-registry', false);
    assert.ok(toggledOff);
    assert.equal(toggledOff.enabled, false);

    const activeList = dbModule.getActiveMcpServers();
    assert.equal(
      activeList.some((s) => s.id === 'terraform-registry'),
      false,
      'Disabled server must not appear in active list'
    );

    // Re-enable
    const toggledOn = dbModule.toggleMcpServer('terraform-registry', true);
    assert.ok(toggledOn);
    assert.equal(toggledOn.enabled, true);
  });

  test('4. saveMcpServer registers a new custom MCP server', () => {
    const newServer = dbModule.saveMcpServer({
      id: 'gitlab-pipelines-test',
      name: 'GitLab Pipelines Test MCP',
      description: 'Custom test MCP for CI pipelines',
      transport: 'sse',
      url: 'https://mcp.internal.gitlab.com/sse',
      enabled: true,
      status: 'active',
      tools: [{ name: 'trigger_pipeline', description: 'Triggers a GitLab pipeline run' }]
    });

    assert.ok(newServer);
    assert.equal(newServer.id, 'gitlab-pipelines-test');
    assert.equal(newServer.transport, 'sse');
    assert.equal(newServer.tools.length, 1);
    assert.equal(newServer.tools[0].name, 'trigger_pipeline');

    const fetched = dbModule.getMcpServerById('gitlab-pipelines-test');
    assert.ok(fetched);
    assert.equal(fetched.name, 'GitLab Pipelines Test MCP');
  });

  test('5. deleteMcpServer removes a custom MCP server', () => {
    const deleted = dbModule.deleteMcpServer('gitlab-pipelines-test');
    assert.equal(deleted, true);

    const fetched = dbModule.getMcpServerById('gitlab-pipelines-test');
    assert.equal(fetched, undefined);
  });
});
