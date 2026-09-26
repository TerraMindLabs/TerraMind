import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';
import { getSetting } from '../db';

const execPromise = promisify(exec);

export const WORKSPACE_PATH = process.env.TF_WORKSPACE || process.env.WORKSPACE_DIR || path.resolve(process.cwd(), '..', '..', 'Terraform');

export async function ensureWorkspace(): Promise<string> {
  try {
    await fs.mkdir(WORKSPACE_PATH, { recursive: true });
  } catch (e) {
    // Ignore if directory already exists
  }
  return WORKSPACE_PATH;
}

/**
 * Returns environment variables augmented with common CLI installation directories
 * (winget links, %LOCALAPPDATA%\tfsec, user profile bin, /usr/local/bin, etc.)
 */
function getAugmentedEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const isWin = process.platform === 'win32';

  if (isWin) {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const userProfile = process.env.USERPROFILE || os.homedir();
    const extraPaths = [
      path.join(localAppData, 'Microsoft', 'WinGet', 'Links'),
      path.join(localAppData, 'tfsec'),
      path.join(userProfile, 'bin'),
      'C:\\ProgramData\\chocolatey\\bin'
    ];
    env.PATH = (env.PATH || '') + ';' + extraPaths.join(';');
  } else {
    const extraPaths = [
      '/usr/local/bin',
      path.join(os.homedir(), '.local', 'bin'),
      path.join(os.homedir(), 'bin')
    ];
    env.PATH = (env.PATH || '') + ':' + extraPaths.join(':');
  }

  // Pass Infracost API key from settings if not set in process.env
  if (!env.INFRACOST_API_KEY) {
    const dbKey = getSetting('infracost_api_key');
    if (dbKey) env.INFRACOST_API_KEY = dbKey;
  }

  return env;
}

/**
 * Resolves a binary command to its full path if available in candidate folders
 */
function resolveBinary(binName: string): string {
  const isWin = process.platform === 'win32';
  const exeName = isWin ? `${binName}.exe` : binName;

  const candidatePaths: string[] = [];
  if (isWin) {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const userProfile = process.env.USERPROFILE || os.homedir();
    candidatePaths.push(
      path.join(localAppData, 'tfsec', 'tfsec.exe'),
      path.join(localAppData, 'Microsoft', 'WinGet', 'Links', exeName),
      path.join(localAppData, 'Programs', binName, exeName),
      path.join(userProfile, 'bin', exeName),
      path.join('C:\\ProgramData\\chocolatey\\bin', exeName)
    );
  } else {
    candidatePaths.push(
      path.join('/usr/local/bin', binName),
      path.join('/usr/bin', binName),
      path.join(os.homedir(), '.local', 'bin', binName),
      path.join(os.homedir(), 'bin', binName)
    );
  }

  for (const p of candidatePaths) {
    if (fsSync.existsSync(p)) {
      return `"${p}"`;
    }
  }

  return binName;
}

export async function listWorkspaceFiles(): Promise<Array<{ name: string; size: number; content?: string }>> {
  await ensureWorkspace();
  const files: Array<{ name: string; size: number; content?: string }> = [];

  async function walkDir(currentDir: string, relativePrefix: string, depth = 0) {
    if (depth > 4) return;
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = path.join(currentDir, entry.name);
        const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walkDir(fullPath, relPath, depth + 1);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.tf') ||
            entry.name.endsWith('.tfvars') ||
            entry.name.endsWith('.json') ||
            entry.name.endsWith('.yaml') ||
            entry.name.endsWith('.yml') ||
            entry.name.endsWith('.md'))
        ) {
          const stat = await fs.stat(fullPath);
          const content = await fs.readFile(fullPath, 'utf8');
          files.push({ name: relPath, size: stat.size, content });
        }
      }
    } catch {}
  }

  await walkDir(WORKSPACE_PATH, '');
  return files;
}

export async function writeWorkspaceFile(
  filename: string,
  content: string
): Promise<{ path: string; relPath: string; fmtOutput?: string; validateOutput?: string }> {
  await ensureWorkspace();

  // Strict Security: Reject any directory traversal sequences (.. or ../ or ..\)
  if (filename.includes('..') || filename.includes('/../') || filename.includes('\\..\\')) {
    throw new Error('Access denied: target path escapes workspace');
  }

  const cleanRelPath = filename.replace(/^[\\\/]+/, '');
  const targetPath = path.resolve(WORKSPACE_PATH, cleanRelPath);
  const normalizedWs = path.resolve(WORKSPACE_PATH);

  if (!targetPath.toLowerCase().startsWith(normalizedWs.toLowerCase())) {
    throw new Error('Access denied: target path escapes workspace');
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, 'utf8');

  // Automatic Agent Action: If writing Terraform HCL, automatically run terraform fmt and terraform validate
  let fmtOutput = '';
  let validateOutput = '';

  const fileDir = path.dirname(targetPath);
  if (cleanRelPath.endsWith('.tf')) {
    const env = getAugmentedEnv();
    const tfBin = resolveBinary('terraform');

    try {
      const fmtRes = await execPromise(`${tfBin} fmt`, { cwd: fileDir, env });
      fmtOutput = fmtRes.stdout.trim() || 'Success (Formatted cleanly)';
    } catch (e: any) {
      fmtOutput = e.stderr || e.stdout || e.message;
    }

    try {
      const valRes = await execPromise(`${tfBin} validate`, { cwd: fileDir, env });
      validateOutput = valRes.stdout.trim() || 'Success (Configuration is valid)';
    } catch (e: any) {
      const errMsg = e.stderr || e.stdout || e.message;
      if (errMsg.includes('terraform init') || errMsg.includes('not been initialized')) {
        try {
          await execPromise(`${tfBin} init -backend=false`, { cwd: fileDir, env });
          const retryVal = await execPromise(`${tfBin} validate`, { cwd: fileDir, env });
          validateOutput = retryVal.stdout.trim() || 'Success (Configuration is valid)';
        } catch {
          validateOutput = 'Syntax parsed. Requires provider credentials / backend initialization for full validation.';
        }
      } else {
        validateOutput = errMsg;
      }
    }
  }

  return { path: targetPath, relPath: cleanRelPath, fmtOutput, validateOutput };
}

export interface SecurityFinding {
  id: string;
  rule_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  resource: string;
  filename: string;
  startLine: number;
  endLine: number;
  resolution: string;
  explanation?: string;
  links?: string[];
}

export interface ValidationFinding {
  severity: 'error' | 'warning';
  summary: string;
  detail: string;
  filename?: string;
  startLine?: number;
}

export interface CostResource {
  name: string;
  resourceType: string;
  monthlyCost: string;
}

export interface InfracostSummary {
  totalMonthlyCost?: string;
  totalHourlyCost?: string;
  currency?: string;
  resources?: CostResource[];
  apiKeyRequired?: boolean;
  message?: string;
}

export interface TerraformCommandResult {
  success: boolean;
  output: string;
  findings?: SecurityFinding[];
  validationFindings?: ValidationFinding[];
  costSummary?: InfracostSummary;
}

export async function runTerraformCommand(
  action: 'init' | 'fmt' | 'validate' | 'plan' | 'tfsec' | 'infracost'
): Promise<TerraformCommandResult> {
  await ensureWorkspace();
  const env = getAugmentedEnv();

  const tfBin = resolveBinary('terraform');
  const tfsecBin = resolveBinary('tfsec');
  const infracostBin = resolveBinary('infracost');

  if (action === 'tfsec') {
    let rawStdout = '';
    let rawStderr = '';
    let hasError = false;

    try {
      const res = await execPromise(`${tfsecBin} . --format json --no-colour`, { cwd: WORKSPACE_PATH, env });
      rawStdout = res.stdout;
      rawStderr = res.stderr;
    } catch (e: any) {
      // tfsec returns exit code 1 when security issues are discovered
      rawStdout = e.stdout || '';
      rawStderr = e.stderr || e.message;
      hasError = true;
    }

    const fullRaw = (rawStdout + '\n' + rawStderr).trim();
    const findings: SecurityFinding[] = [];

    // Parse JSON results
    try {
      const jsonStart = rawStdout.indexOf('{');
      const jsonEnd = rawStdout.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(rawStdout.slice(jsonStart, jsonEnd + 1));
        if (Array.isArray(parsed.results)) {
          for (const r of parsed.results) {
            findings.push({
              id: r.rule_id || 'tfsec-rule',
              rule_id: r.rule_id || '',
              severity: (r.severity || 'MEDIUM').toUpperCase(),
              description: r.description || r.rule_description || 'Security misconfiguration detected',
              resource: r.resource || '',
              filename: r.location?.filename ? path.basename(r.location.filename) : 'main.tf',
              startLine: r.location?.start_line || 1,
              endLine: r.location?.end_line || 1,
              resolution: r.resolution || 'Apply recommended secure configuration attributes.',
              explanation: r.explanation || '',
              links: r.links || []
            });
          }
        }
      }
    } catch {
      // Keep raw output if JSON parse fails
    }

    const cleanDisplayOutput = findings.length > 0
      ? `tfsec scan complete: found ${findings.length} security finding(s).\n\n` +
        findings.map(f => `[${f.severity}] ${f.id} (${f.filename}:${f.startLine}) -> ${f.description}`).join('\n')
      : fullRaw || 'tfsec scan completed: 0 security vulnerabilities found. Excellent!';

    return {
      success: findings.length === 0 && !hasError,
      output: cleanDisplayOutput,
      findings
    };
  }

  if (action === 'validate') {
    let rawStdout = '';
    let rawStderr = '';
    let isSuccess = true;

    try {
      const res = await execPromise(`${tfBin} validate -json`, { cwd: WORKSPACE_PATH, env });
      rawStdout = res.stdout;
      rawStderr = res.stderr;
    } catch (e: any) {
      rawStdout = e.stdout || '';
      rawStderr = e.stderr || e.message;
      isSuccess = false;
    }

    const validationFindings: ValidationFinding[] = [];
    try {
      const jsonStart = rawStdout.indexOf('{');
      const jsonEnd = rawStdout.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(rawStdout.slice(jsonStart, jsonEnd + 1));
        if (Array.isArray(parsed.diagnostics)) {
          for (const d of parsed.diagnostics) {
            validationFindings.push({
              severity: d.severity || 'error',
              summary: d.summary || 'Validation Issue',
              detail: d.detail || '',
              filename: d.range?.filename ? path.basename(d.range.filename) : undefined,
              startLine: d.range?.start?.line
            });
          }
        }
      }
    } catch {}

    const textOutput = validationFindings.length > 0
      ? `terraform validate: ${validationFindings.length} issue(s) detected.\n\n` +
        validationFindings.map(v => `[${v.severity.toUpperCase()}] ${v.summary}: ${v.detail} (${v.filename || 'workspace'}:${v.startLine || 1})`).join('\n')
      : (rawStdout + '\n' + rawStderr).trim() || 'Success! The configuration is valid.';

    return {
      success: isSuccess && validationFindings.length === 0,
      output: textOutput,
      validationFindings
    };
  }

  if (action === 'infracost') {
    let rawStdout = '';
    let rawStderr = '';
    let isSuccess = true;

    try {
      const res = await execPromise(`${infracostBin} breakdown --path . --format json`, { cwd: WORKSPACE_PATH, env });
      rawStdout = res.stdout;
      rawStderr = res.stderr;
    } catch (e: any) {
      rawStdout = e.stdout || '';
      rawStderr = e.stderr || e.message;
      isSuccess = false;
    }

    const fullRaw = (rawStdout + '\n' + rawStderr).trim();

    if (fullRaw.includes('INFRACOST_API_KEY is not set') || fullRaw.includes('infracost auth login')) {
      return {
        success: false,
        output: 'Infracost requires a free API key to calculate cloud pricing.\n\n' +
                '1. Get your free key at: https://dashboard.infracost.io\n' +
                '2. Paste it in TerraMind Settings -> API Keys (Infracost API Key), or set INFRACOST_API_KEY in .env.',
        costSummary: {
          apiKeyRequired: true,
          message: 'Infracost API key required. Go to Settings -> API Keys.'
        }
      };
    }

    let costSummary: InfracostSummary | undefined;
    try {
      const jsonStart = rawStdout.indexOf('{');
      const jsonEnd = rawStdout.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(rawStdout.slice(jsonStart, jsonEnd + 1));
        const resources: CostResource[] = [];
        if (Array.isArray(parsed.projects)) {
          for (const proj of parsed.projects) {
            if (proj.breakdown?.resources) {
              for (const r of proj.breakdown.resources) {
                resources.push({
                  name: r.name,
                  resourceType: r.resourceType || '',
                  monthlyCost: r.monthlyCost ? `$${parseFloat(r.monthlyCost).toFixed(2)}` : '$0.00'
                });
              }
            }
          }
        }

        costSummary = {
          totalMonthlyCost: parsed.totalMonthlyCost ? `$${parseFloat(parsed.totalMonthlyCost).toFixed(2)}` : '$0.00',
          totalHourlyCost: parsed.totalHourlyCost ? `$${parseFloat(parsed.totalHourlyCost).toFixed(4)}` : '$0.00',
          currency: parsed.currency || 'USD',
          resources
        };
      }
    } catch {}

    const textOutput = costSummary?.totalMonthlyCost
      ? `Infracost Breakdown:\nTotal Monthly Cost: ${costSummary.totalMonthlyCost} ${costSummary.currency || 'USD'}\n\n` +
        (costSummary.resources?.map(r => `• ${r.name} (${r.resourceType}): ${r.monthlyCost}/mo`).join('\n') || 'No chargeable resources detected.')
      : fullRaw;

    return {
      success: isSuccess,
      output: textOutput,
      costSummary
    };
  }

  // Fallback standard actions: init, fmt, plan
  let cmd = `${tfBin} fmt`;
  if (action === 'init') {
    cmd = `${tfBin} init -backend=false`;
  } else if (action === 'plan') {
    cmd = `${tfBin} plan -no-color`;
  }

  try {
    const { stdout, stderr } = await execPromise(cmd, { cwd: WORKSPACE_PATH, env });
    return {
      success: true,
      output: (stdout + '\n' + (stderr || '')).trim()
    };
  } catch (error: any) {
    return {
      success: false,
      output: (error.stdout || '') + '\n' + (error.stderr || error.message)
    };
  }
}
