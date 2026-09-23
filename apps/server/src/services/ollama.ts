import { spawn } from 'child_process';

export async function isOllamaRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('http://127.0.0.1:11434/api/version', { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function startOllamaDaemon(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const child = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      child.unref();

      // Poll up to 5 seconds for Ollama to become responsive
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
