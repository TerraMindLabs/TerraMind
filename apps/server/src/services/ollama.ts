import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

export async function isOllamaInstalled(): Promise<{ installed: boolean; version?: string; path?: string }> {
  try {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'where ollama' : 'command -v ollama || which ollama';
    const { stdout } = await execAsync(cmd);
    const ollamaPath = stdout.trim().split('\n')[0].trim();
    if (ollamaPath) {
      try {
        const { stdout: verOut } = await execAsync(`"${ollamaPath}" --version`);
        return { installed: true, version: verOut.trim(), path: ollamaPath };
      } catch {
        return { installed: true, path: ollamaPath };
      }
    }
    return { installed: false };
  } catch {
    return { installed: false };
  }
}

export function startOllamaDaemon(): Promise<{ success: boolean; running: boolean; error?: string }> {
  return new Promise(async (resolve) => {
    // If already running:
    if (await isOllamaRunning()) {
      return resolve({ success: true, running: true });
    }

    try {
      let stderrOutput = '';
      const isWin = process.platform === 'win32';

      if (isWin) {
        const child = spawn('ollama', ['serve'], {
          detached: true,
          stdio: ['ignore', 'ignore', 'pipe'],
          shell: true
        });
        child.stderr?.on('data', (d) => {
          stderrOutput += d.toString();
        });
        child.on('error', (err) => {
          stderrOutput += ` ${err.message}`;
        });
        child.unref();
      } else {
        const child = spawn(
          'sh',
          ['-c', 'nohup ollama serve > /tmp/ollama.log 2>&1 &'],
          { detached: true, stdio: 'ignore' }
        );
        child.unref();
      }

      // Poll up to 6 seconds for Ollama to become responsive
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const running = await isOllamaRunning();
        if (running) {
          clearInterval(interval);
          return resolve({ success: true, running: true });
        }
        if (attempts >= 12) {
          clearInterval(interval);
          return resolve({
            success: false,
            running: false,
            error:
              stderrOutput.trim() ||
              'Ollama process launched but port 11434 did not respond within 6 seconds. Try running "Download & Install Ollama".'
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
