import path from 'path';
import fs from 'fs';

/**
 * Loads .env file into process.env before any other modules execute.
 */
export function loadEnvironment(): void {
  const candidates = [
    process.env.ENV_FILE,
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps', 'server', '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
    path.resolve(__dirname, '..', '..', '..', '.env')
  ].filter(Boolean) as string[];

  let loaded = false;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const stat = fs.statSync(p);
        if (stat.isFile()) {
          const content = fs.readFileSync(p, 'utf8');
          const lines = content.split(/\r?\n/);
          let count = 0;
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) continue;
            const key = trimmed.slice(0, eqIndex).trim();
            let val = trimmed.slice(eqIndex + 1).trim();

            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }

            if (!process.env[key] || process.env[key]?.trim() === '') {
              process.env[key] = val;
              count++;
            }
          }
          console.log(`[Env] Loaded ${count} configuration variables from ${p}`);
          loaded = true;
          break; // Stop after first valid .env found
        }
      } catch (err) {
        console.warn(`[Env] Warning reading ${p}:`, err);
      }
    }
  }

  if (!loaded) {
    console.log('[Env] No .env file found in search paths.');
  }
}

// Automatically load on import
loadEnvironment();
