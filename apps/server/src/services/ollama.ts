import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import fs from 'fs';
import { getSetting } from '../db';

export function getOllamaBaseUrl(): string {
  try {
    const raw = getSetting('ollama_host') || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    let host = raw.trim();
    if (!host) host = 'http://127.0.0.1:11434';
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = `http://${host}`;
    }
    // If configured to listen on 0.0.0.0 (all interfaces), local fetch should connect via 127.0.0.1
    if (host.includes('://0.0.0.0')) {
      return host.replace('://0.0.0.0', '://127.0.0.1');
    }
    return host.replace(/\/+$/, '');
  } catch {
    return 'http://127.0.0.1:11434';
  }
}

export async function isOllamaRunning(customHost?: string): Promise<boolean> {
  const configured = customHost || getOllamaBaseUrl();
  const hosts = Array.from(new Set([configured, 'http://127.0.0.1:11434', 'http://localhost:11434']));
  for (const host of hosts) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${host}/api/version`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return true;
    } catch {}
  }
  return false;
}

export async function isOllamaInstalled(): Promise<{
  installed: boolean;
  version?: string;
  path?: string;
  muslIncompatible?: boolean;
  error?: string;
}> {
  try {
    const isWin = process.platform === 'win32';
    if (!isWin) {
      // Check standard Linux binary paths directly first
      const candidatePaths = [
        '/usr/local/bin/ollama',
        '/usr/bin/ollama',
        `${process.env.HOME || ''}/.local/bin/ollama`,
        '/bin/ollama'
      ];
      for (const p of candidatePaths) {
        if (p && fs.existsSync(p)) {
          try {
            const { stdout: verOut } = await execAsync(`"${p}" --version`);
            return { installed: true, version: verOut.trim(), path: p };
          } catch (e: any) {
            const errStr = `${e.stderr || ''} ${e.stdout || ''} ${e.message || ''}`;
            if (errStr.includes('fcntl64') || errStr.includes('Error relocating') || errStr.includes('symbol not found')) {
              return {
                installed: false,
                path: p,
                muslIncompatible: true,
                error: 'Alpine Linux (musl libc) incompatibility: Ollama native binary requires glibc (fcntl64 symbol not found).'
              };
            }
            return { installed: true, path: p };
          }
        }
      }
    }

    const cmd = isWin ? 'where ollama' : 'command -v ollama || which ollama';
    const { stdout } = await execAsync(cmd);
    const ollamaPath = stdout.trim().split('\n')[0].trim();
    if (ollamaPath) {
      try {
        const { stdout: verOut } = await execAsync(`"${ollamaPath}" --version`);
        return { installed: true, version: verOut.trim(), path: ollamaPath };
      } catch (e: any) {
        const errStr = `${e.stderr || ''} ${e.stdout || ''} ${e.message || ''}`;
        if (errStr.includes('fcntl64') || errStr.includes('Error relocating') || errStr.includes('symbol not found')) {
          return {
            installed: false,
            path: ollamaPath,
            muslIncompatible: true,
            error: 'Alpine Linux (musl libc) incompatibility: Ollama native binary requires glibc (fcntl64 symbol not found).'
          };
        }
        return { installed: true, path: ollamaPath };
      }
    }
    return { installed: false };
  } catch {
    return { installed: false };
  }
}

export function startOllamaDaemon(): Promise<{
  success: boolean;
  running: boolean;
  error?: string;
  isMuslError?: boolean;
}> {
  return new Promise(async (resolve) => {
    // If already running:
    if (await isOllamaRunning()) {
      return resolve({ success: true, running: true });
    }

    try {
      let stderrOutput = '';
      const isWin = process.platform === 'win32';

      // Always set OLLAMA_HOST to 0.0.0.0:11434 and OLLAMA_ORIGINS to * so that port forwarding across
      // Docker, WSL, remote Linux, dev tunnels, and codespaces works seamlessly without loopback blockage.
      process.env.OLLAMA_HOST = process.env.OLLAMA_HOST || '0.0.0.0:11434';
      process.env.OLLAMA_ORIGINS = process.env.OLLAMA_ORIGINS || '*';

      if (isWin) {
        const child = spawn('ollama', ['serve'], {
          detached: true,
          stdio: ['ignore', 'ignore', 'pipe'],
          shell: true,
          env: {
            ...process.env,
            OLLAMA_HOST: '0.0.0.0:11434',
            OLLAMA_ORIGINS: '*'
          }
        });
        child.stderr?.on('data', (d) => {
          stderrOutput += d.toString();
        });
        child.on('error', (err) => {
          stderrOutput += ` ${err.message}`;
        });
        child.unref();
      } else {
        // Check if musl libc incompatibility exists before running a crashing binary
        const installedInfo = await isOllamaInstalled();
        if (installedInfo.muslIncompatible) {
          // Attempt to check if Docker is running and can start official container
          try {
            const { stdout: dockerOut } = await execAsync('docker ps 2>/dev/null || sudo -n docker ps 2>/dev/null');
            if (dockerOut) {
              await execAsync(
                'docker start terramind-ollama 2>/dev/null || docker start ollama 2>/dev/null || docker run -d -p 11434:11434 -v ollama:/root/.ollama --name terramind-ollama ollama/ollama 2>/dev/null'
              );
              for (let d = 0; d < 8; d++) {
                await new Promise((r) => setTimeout(r, 600));
                if (await isOllamaRunning()) {
                  return resolve({ success: true, running: true });
                }
              }
            }
          } catch {}

          return resolve({
            success: false,
            running: false,
            isMuslError: true,
            error:
              'Alpine Linux (musl libc) incompatibility: Ollama native binary requires glibc (fcntl64: symbol not found). Run Ollama via Docker: "docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama" or configure Host URL to http://host.docker.internal:11434.'
          });
        }

        // 1. In Linux, first attempt systemctl if available
        try {
          await execAsync(
            '(sudo -n mkdir -p /etc/systemd/system/ollama.service.d 2>/dev/null && ' +
            'printf "[Service]\\nEnvironment=\\"OLLAMA_HOST=0.0.0.0:11434\\"\\nEnvironment=\\"OLLAMA_ORIGINS=*\\"\\n" | sudo -n tee /etc/systemd/system/ollama.service.d/terramind-bind.conf >/dev/null && ' +
            'sudo -n systemctl daemon-reload 2>/dev/null) || true; ' +
            'systemctl start ollama 2>/dev/null || sudo -n systemctl start ollama 2>/dev/null'
          );
        } catch {}

        // Quick check if systemd started it
        if (await isOllamaRunning()) {
          return resolve({ success: true, running: true });
        }

        // 2. Locate the actual executable
        const binPath = installedInfo.path || 'ollama';

        const envPath = `/usr/local/bin:/usr/bin:/bin:${process.env.HOME || ''}/.local/bin:${process.env.PATH || ''}`;
        const child = spawn(
          'sh',
          ['-c', `nohup "${binPath}" serve > /tmp/ollama.log 2>&1 &`],
          {
            detached: true,
            stdio: 'ignore',
            env: {
              ...process.env,
              OLLAMA_HOST: '0.0.0.0:11434',
              OLLAMA_ORIGINS: '*',
              PATH: envPath
            }
          }
        );
        child.unref();
      }

      // Poll up to 10 seconds for Ollama to become responsive
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const running = await isOllamaRunning();
        if (running) {
          clearInterval(interval);
          return resolve({ success: true, running: true });
        }
        if (attempts >= 20) {
          clearInterval(interval);

          let logTail = '';
          if (!isWin && fs.existsSync('/tmp/ollama.log')) {
            try {
              logTail = fs.readFileSync('/tmp/ollama.log', 'utf8').trim().split('\n').slice(-4).join(' ');
            } catch {}
          }

          if (logTail.includes('fcntl64') || logTail.includes('Error relocating') || logTail.includes('symbol not found')) {
            // Attempt docker fallback
            try {
              const { stdout: dockerOut } = await execAsync('docker ps 2>/dev/null || sudo -n docker ps 2>/dev/null');
              if (dockerOut) {
                await execAsync(
                  'docker start terramind-ollama 2>/dev/null || docker start ollama 2>/dev/null || docker run -d -p 11434:11434 -v ollama:/root/.ollama --name terramind-ollama ollama/ollama 2>/dev/null'
                );
                for (let d = 0; d < 8; d++) {
                  await new Promise((r) => setTimeout(r, 600));
                  if (await isOllamaRunning()) {
                    return resolve({ success: true, running: true });
                  }
                }
              }
            } catch {}

            return resolve({
              success: false,
              running: false,
              isMuslError: true,
              error:
                'Alpine Linux (musl libc) incompatibility: Ollama native binary requires glibc (fcntl64: symbol not found). Run Ollama via Docker: "docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama" or configure Host URL to http://host.docker.internal:11434.'
            });
          }

          return resolve({
            success: false,
            running: false,
            error:
              logTail ||
              stderrOutput.trim() ||
              'Ollama process launched but port 11434 did not respond within 10 seconds. Check if port 11434 is in use or run "ollama serve" manually.'
          });
        }
      }, 500);
    } catch (err: any) {
      resolve({ success: false, running: false, error: err.message || 'Failed to spawn ollama process' });
    }
  });
}

export function installOllama(onLog: (line: string) => void): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    let cmd = '';
    let args: string[] = [];

    if (isWin) {
      cmd = 'powershell.exe';
      args = [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        'Write-Host ">>> Attempting winget install for Ollama..."; winget install Ollama.Ollama --accept-source-agreements --accept-package-agreements; if ($LASTEXITCODE -ne 0) { Write-Host ">>> Winget failed or not available. Downloading official Ollama installer..."; Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile "$env:TEMP\\OllamaSetup.exe"; Start-Process -Wait "$env:TEMP\\OllamaSetup.exe" /SILENT; Write-Host ">>> Installer completed." }'
      ];
    } else {
      cmd = 'sh';
      args = [
        '-c',
        'echo ">>> Checking operating system environment..." && ' +
        'if command -v apk >/dev/null 2>&1; then ' +
        '  echo ">>> Alpine Linux detected. Installing glibc compatibility and curl..." && ' +
        '  (sudo apk add --no-cache curl gcompat libc6-compat 2>/dev/null || apk add --no-cache curl gcompat libc6-compat 2>/dev/null || true); ' +
        'elif command -v apt-get >/dev/null 2>&1; then ' +
        '  echo ">>> Debian/Ubuntu detected. Installing dependencies..." && ' +
        '  (sudo apt-get update && sudo apt-get install -y curl zstd 2>/dev/null || true); ' +
        'fi && ' +
        'echo ">>> Downloading and executing official Ollama install script..." && ' +
        '(curl -fsSL https://ollama.com/install.sh | sudo sh 2>/dev/null || curl -fsSL https://ollama.com/install.sh | sh) && ' +
        'echo ">>> Starting Ollama background daemon on port 11434..." && ' +
        'nohup ollama serve > /tmp/ollama.log 2>&1 &'
      ];
    }

    try {
      const child = spawn(cmd, args, { shell: true });
      let outputBuffer = '';

      child.stdout?.on('data', (d) => {
        const text = d.toString();
        outputBuffer += text;
        onLog(text);
      });

      child.stderr?.on('data', (d) => {
        const text = d.toString();
        outputBuffer += text;
        onLog(text);
      });

      child.on('close', async (code) => {
        onLog(`\n>>> Installation process exited with code ${code}.\n>>> Verifying Ollama daemon health on port 11434...\n`);
        // Poll for Ollama service to become responsive
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          const running = await isOllamaRunning();
          if (running) {
            clearInterval(interval);
            onLog('>>> ✓ Ollama service is active and responsive on port 11434!\n');
            return resolve({ success: true });
          }
          if (attempts >= 10) {
            clearInterval(interval);
            // Try launching ollama serve once more in case it wasn't started
            await startOllamaDaemon();
            const finalCheck = await isOllamaRunning();
            if (finalCheck) {
              onLog('>>> ✓ Ollama daemon started successfully!\n');
              return resolve({ success: true });
            }
            return resolve({
              success: false,
              error: `Installation completed (exit code ${code}) but Ollama service is not responding on 127.0.0.1:11434. Log: ${outputBuffer.slice(-300)}`
            });
          }
        }, 1200);
      });

      child.on('error', (err) => {
        onLog(`>>> Process execution error: ${err.message}\n`);
        resolve({ success: false, error: err.message });
      });
    } catch (err: any) {
      onLog(`>>> Unexpected error: ${err.message}\n`);
      resolve({ success: false, error: err.message });
    }
  });
}
