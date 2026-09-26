import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getOllamaBaseUrl, isOllamaRunning } from '../services/ollama';
import { setSetting } from '../db';

describe('Ollama Service & Port Forwarding Tests', () => {
  test('1. getOllamaBaseUrl defaults to loopback 127.0.0.1:11434', () => {
    setSetting('ollama_host', 'http://127.0.0.1:11434');
    const url = getOllamaBaseUrl();
    assert.strictEqual(url, 'http://127.0.0.1:11434');
  });

  test('2. getOllamaBaseUrl normalizes 0.0.0.0 binding to 127.0.0.1 for local client requests', () => {
    setSetting('ollama_host', 'http://0.0.0.0:11434');
    const url = getOllamaBaseUrl();
    assert.strictEqual(url, 'http://127.0.0.1:11434');
  });

  test('3. getOllamaBaseUrl preserves remote or forwarded IPs and hostnames', () => {
    setSetting('ollama_host', 'http://192.168.1.100:11434/');
    const url = getOllamaBaseUrl();
    assert.strictEqual(url, 'http://192.168.1.100:11434');
  });

  test('4. getOllamaBaseUrl adds http:// protocol if omitted', () => {
    setSetting('ollama_host', 'host.docker.internal:11434');
    const url = getOllamaBaseUrl();
    assert.strictEqual(url, 'http://host.docker.internal:11434');
  });

  test('5. isOllamaRunning handles offline ports gracefully without unhandled exceptions', async () => {
    // Port 59999 should safely return false
    const running = await isOllamaRunning('http://127.0.0.1:59999');
    assert.strictEqual(running, false);
  });
});
