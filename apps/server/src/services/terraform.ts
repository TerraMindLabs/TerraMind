import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';
import { getSetting } from '../db';

const execPromise = promisify(exec);

function resolveDefaultWorkspacePath(): string {
  const cwd = process.cwd();
  // If started from repo root (e.g. `node apps/server/dist/server.js` or `npm start`)
  if (fsSync.existsSync(path.join(cwd, 'apps', 'server'))) {
    return path.join(cwd, 'Terraform');
  }
  // If started from `apps/server` (e.g. `npm run dev -w @terramind/server`)
  if (path.basename(cwd) === 'server' && fsSync.existsSync(path.resolve(cwd, '..', '..', 'package.json'))) {
    return path.resolve(cwd, '..', '..', 'Terraform');
  }
  // Fallback inside current directory (never escape to filesystem root '/')
  return path.join(cwd, 'Terraform');
}

export const WORKSPACE_PATH = process.env.TF_WORKSPACE || process.env.WORKSPACE_DIR || resolveDefaultWorkspacePath();

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

/**
 * Returns the active IaC binary ('terraform' or 'tofu') from SQLite settings or TF_BINARY env.
 */
export function getTfBinary(): 'terraform' | 'tofu' {
  try {
    const setting = getSetting('tf_binary');
    if (setting === 'tofu') return 'tofu';
    if (setting === 'terraform') return 'terraform';
  } catch {}
  return process.env.TF_BINARY === 'tofu' ? 'tofu' : 'terraform';
}

/**
 * Returns whether ephemeral Docker sandboxing is enabled for CLI execution.
 */
export function isSandboxEnabled(): boolean {
  try {
    const setting = getSetting('sandbox_mode');
    if (setting === 'true') return true;
    if (setting === 'false') return false;
  } catch {}
  return process.env.TERRAMIND_SANDBOX === 'true';
}

let cachedDockerAvailable: { checkedAt: number; available: boolean } | null = null;

export async function isDockerAvailable(): Promise<boolean> {
  if (cachedDockerAvailable && Date.now() - cachedDockerAvailable.checkedAt < 15000) {
    return cachedDockerAvailable.available;
  }
  try {
    await execPromise('docker info --format "{{.ServerVersion}}"', { timeout: 2500 });
    cachedDockerAvailable = { checkedAt: Date.now(), available: true };
    return true;
  } catch {
    cachedDockerAvailable = { checkedAt: Date.now(), available: false };
    return false;
  }
}

export async function getExecutionEnvironmentInfo(): Promise<{
  tfBinary: 'terraform' | 'tofu';
  sandboxMode: boolean;
  dockerAvailable: boolean;
}> {
  const [dockerAvailable] = await Promise.all([isDockerAvailable()]);
  return {
    tfBinary: getTfBinary(),
    sandboxMode: isSandboxEnabled(),
    dockerAvailable
  };
}

/**
 * Validates that a resolved directory or file path stays strictly inside WORKSPACE_PATH.
 */
function assertPathInsideWorkspace(targetPath: string): void {
  const normalizedWs = path.resolve(WORKSPACE_PATH);
  const resolved = path.resolve(targetPath);
  if (
    resolved.toLowerCase() !== normalizedWs.toLowerCase() &&
    !resolved.toLowerCase().startsWith((normalizedWs + path.sep).toLowerCase())
  ) {
    throw new Error('Access denied: target path escapes workspace');
  }
}

/**
 * Executes a CLI command in the workspace, optionally inside an ephemeral rootless Docker container.
 */
export async function execInWorkspace(
  cmd: string,
  effectiveDir: string,
  env: NodeJS.ProcessEnv,
  options?: { allowNetwork?: boolean; dockerImage?: string; timeoutMs?: number }
): Promise<{ stdout: string; stderr: string; sandboxed: boolean }> {
  assertPathInsideWorkspace(effectiveDir);
  const timeout = options?.timeoutMs ?? 60000;

  if (isSandboxEnabled()) {
    const dockerOk = await isDockerAvailable();
    if (!dockerOk) {
      throw new Error(
        'Sandbox mode is enabled, but Docker daemon is not running or not installed. Start Docker or disable Sandbox Mode in Settings.'
      );
    }
    const image = options?.dockerImage || process.env.TERRAMIND_SANDBOX_IMAGE || 'alpine:3.20';
    const netFlag = options?.allowNetwork ? '' : '--network=none';
    const escapedCmd = cmd.replace(/"/g, '\\"');
    const dockerCmd =
      `docker run --rm --init ${netFlag} ` +
      `--security-opt=no-new-privileges --cap-drop=ALL ` +
      `--user 65534:65534 ` +
      `-v "${effectiveDir}:/workspace" -w /workspace ` +
      `${image} sh -c "${escapedCmd}"`;
    const res = await execPromise(dockerCmd, { cwd: effectiveDir, env, timeout });
    return { stdout: res.stdout, stderr: res.stderr, sandboxed: true };
  }

  const res = await execPromise(cmd, { cwd: effectiveDir, env, timeout });
  return { stdout: res.stdout, stderr: res.stderr, sandboxed: false };
}

export async function listWorkspaceFiles(options?: { includeContent?: boolean }): Promise<Array<{ name: string; size: number; content?: string }>> {
  await ensureWorkspace();
  const includeContent = options?.includeContent !== false;
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
          const content = includeContent ? await fs.readFile(fullPath, 'utf8') : undefined;
          files.push({ name: relPath, size: stat.size, content });
        }
      }
    } catch {}
  }

  await walkDir(WORKSPACE_PATH, '');
  return files;
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

export interface FileVerificationResult {
  filename: string;
  tfBinary?: 'terraform' | 'tofu';
  sandboxed?: boolean;
  scanner?: 'trivy' | 'tfsec' | 'unavailable';
  planJsonScanned?: boolean;
  fmt: { success: boolean; formatted: boolean; output: string };
  validate: { success: boolean; errorCount: number; warningCount: number; diagnostics: ValidationFinding[] };
  trivy?: { success: boolean; issueCount: number; findings: SecurityFinding[]; scanner: 'trivy' | 'tfsec' | 'unavailable'; planJsonScanned: boolean };
  tfsec: { success: boolean; issueCount: number; findings: SecurityFinding[] };
  infracost: InfracostSummary;
  plan: { success: boolean; summary: string };
  overallStatus: 'passed' | 'warning' | 'error';
}

export interface TerraformCommandResult {
  success: boolean;
  output: string;
  findings?: SecurityFinding[];
  validationFindings?: ValidationFinding[];
  costSummary?: InfracostSummary;
  verification?: FileVerificationResult;
}

/**
 * Resolves the effective working directory where .tf files actually live
 * (either root WORKSPACE_PATH, or the target subfolder, or first subfolder containing .tf files)
 */
export async function resolveEffectiveDirectory(targetRelPath?: string): Promise<string> {
  await ensureWorkspace();
  if (targetRelPath) {
    const clean = targetRelPath.replace(/^[\\\/]+/, '');
    const fullTarget = path.resolve(WORKSPACE_PATH, clean);
    if (fsSync.existsSync(fullTarget)) {
      const stat = await fs.stat(fullTarget);
      return stat.isDirectory() ? fullTarget : path.dirname(fullTarget);
    }
    const dirCandidate = path.dirname(fullTarget);
    if (fsSync.existsSync(dirCandidate)) {
      return dirCandidate;
    }
  }

  // Check if root WORKSPACE_PATH has .tf files
  try {
    const entries = await fs.readdir(WORKSPACE_PATH, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && e.name.endsWith('.tf'))) {
      return WORKSPACE_PATH;
    }
    // Check first level subdirectories for .tf files
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        const subPath = path.join(WORKSPACE_PATH, e.name);
        try {
          const subFiles = await fs.readdir(subPath);
          if (subFiles.some((f) => f.endsWith('.tf'))) {
            return subPath;
          }
        } catch {}
      }
    }
  } catch {}

  return WORKSPACE_PATH;
}

/**
 * Parses `trivy config -f json` output (both Misconfigurations and Secrets) into SecurityFinding[].
 */
export function parseTrivyJsonOutput(rawStdout: string, cleanTarget?: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const fileBasename = cleanTarget ? path.basename(cleanTarget) : '';
  const jsonStart = rawStdout.indexOf('{');
  const jsonEnd = rawStdout.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) return findings;

  try {
    const parsed = JSON.parse(rawStdout.slice(jsonStart, jsonEnd + 1));
    const results = Array.isArray(parsed.Results) ? parsed.Results : [];
    for (const result of results) {
      const targetFile = result.Target ? path.basename(result.Target) : 'main.tf';
      if (fileBasename && targetFile !== 'tfplan.json' && targetFile !== fileBasename) continue;

      const misconfigs = Array.isArray(result.Misconfigurations) ? result.Misconfigurations : [];
      for (const m of misconfigs) {
        const startLine = m.CauseMetadata?.StartLine || 1;
        const endLine = m.CauseMetadata?.EndLine || startLine;
        const sev = String(m.Severity || 'MEDIUM').toUpperCase();
        const normalizedSev: SecurityFinding['severity'] =
          sev === 'CRITICAL' || sev === 'HIGH' || sev === 'MEDIUM' || sev === 'LOW' ? sev : 'MEDIUM';
        findings.push({
          id: m.ID || m.AVDID || 'trivy-misconfig',
          rule_id: m.AVDID || m.ID || '',
          severity: normalizedSev,
          description: m.Title || m.Message || m.Description || 'Security misconfiguration detected',
          resource: m.CauseMetadata?.Resource || '',
          filename: targetFile,
          startLine,
          endLine,
          resolution: m.Resolution || 'Apply recommended secure configuration attributes.',
          explanation: m.Description || '',
          links: m.References || (m.PrimaryURL ? [m.PrimaryURL] : [])
        });
      }

      const secrets = Array.isArray(result.Secrets) ? result.Secrets : [];
      for (const s of secrets) {
        const sev = String(s.Severity || 'CRITICAL').toUpperCase();
        const normalizedSev: SecurityFinding['severity'] =
          sev === 'CRITICAL' || sev === 'HIGH' || sev === 'MEDIUM' || sev === 'LOW' ? sev : 'CRITICAL';
        findings.push({
          id: s.RuleID || 'trivy-secret',
          rule_id: s.RuleID || 'hardcoded-secret',
          severity: normalizedSev,
          description: s.Title || `Hardcoded secret detected (${s.Category || 'Secret'})`,
          resource: s.Match || '',
          filename: targetFile,
          startLine: s.StartLine || 1,
          endLine: s.EndLine || s.StartLine || 1,
          resolution: 'Remove hardcoded secret and reference a secret manager or sensitive variable.',
          explanation: s.Category || 'Secret scanning'
        });
      }
    }
  } catch {}

  return findings;
}

/**
 * Executes full pre-flight verification gate: fmt + validate + plan + trivy (on plan JSON if available) + infracost
 */
export async function verifyWorkspaceFile(targetRelPath?: string): Promise<FileVerificationResult> {
  await ensureWorkspace();
  const env = getAugmentedEnv();
  const activeTfBinary = getTfBinary();
  const tfBin = resolveBinary(activeTfBinary);
  const trivyBin = resolveBinary('trivy');
  const tfsecBin = resolveBinary('tfsec');
  const infracostBin = resolveBinary('infracost');
  const sandboxed = isSandboxEnabled();

  const effectiveDir = await resolveEffectiveDirectory(targetRelPath);
  const cleanTarget = targetRelPath ? targetRelPath.replace(/^[\\\/]+/, '') : '';
  const fileBasename = cleanTarget ? path.basename(cleanTarget) : 'workspace';

  // 1. fmt check
  let fmtSuccess = true;
  let isFormatted = false;
  let fmtOutput = '';
  try {
    const fmtTarget = cleanTarget ? `"${path.resolve(WORKSPACE_PATH, cleanTarget)}"` : '';
    const res = await execInWorkspace(`${tfBin} fmt ${fmtTarget}`, effectiveDir, env);
    fmtOutput = res.stdout.trim() || 'Clean';
    isFormatted = Boolean(res.stdout && res.stdout.includes(fileBasename));
  } catch (e: any) {
    fmtSuccess = false;
    fmtOutput = e.stderr || e.stdout || e.message;
  }

  // 2. validate check
  let valSuccess = true;
  const diagnostics: ValidationFinding[] = [];
  try {
    let valRaw = '';
    try {
      const res = await execInWorkspace(`${tfBin} validate -json`, effectiveDir, env);
      valRaw = res.stdout;
    } catch (e: any) {
      valRaw = e.stdout || '';
      if ((e.stderr || e.stdout || '').includes('init') || (e.stderr || e.stdout || '').includes('Plugin')) {
        try {
          await execInWorkspace(`${tfBin} init -backend=false`, effectiveDir, env, { allowNetwork: true });
          const retryRes = await execInWorkspace(`${tfBin} validate -json`, effectiveDir, env);
          valRaw = retryRes.stdout;
        } catch {}
      }
    }

    const jsonStart = valRaw.indexOf('{');
    const jsonEnd = valRaw.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const parsed = JSON.parse(valRaw.slice(jsonStart, jsonEnd + 1));
      if (Array.isArray(parsed.diagnostics)) {
        for (const d of parsed.diagnostics) {
          const diagFile = d.range?.filename ? path.basename(d.range.filename) : undefined;
          if (!cleanTarget || !diagFile || diagFile === fileBasename) {
            diagnostics.push({
              severity: d.severity || 'error',
              summary: d.summary || 'Validation Issue',
              detail: d.detail || '',
              filename: diagFile,
              startLine: d.range?.start?.line
            });
          }
        }
      }
      valSuccess = Boolean(parsed.valid && diagnostics.filter(d => d.severity === 'error').length === 0);
    }
  } catch {
    valSuccess = false;
  }

  // 3. speculative plan check + resolved plan JSON export for Trivy
  let planSuccess = true;
  let planSummary = 'Plan ready';
  let planJsonPath: string | null = null;
  const tfPlanFile = path.join(effectiveDir, 'tfplan');
  const tfPlanJsonFile = path.join(effectiveDir, 'tfplan.json');

  const runPlanWithOut = async () => {
    const res = await execInWorkspace(`${tfBin} plan -no-color -compact-warnings -out=tfplan`, effectiveDir, env, { allowNetwork: true });
    const match = res.stdout.match(/Plan:\s*(\d+\s*to\s*add,\s*\d+\s*to\s*change,\s*\d+\s*to\s*destroy)/i);
    if (match) {
      planSummary = match[1];
    } else if (res.stdout.includes('No changes.')) {
      planSummary = 'No changes (State clean)';
    } else {
      planSummary = 'Speculative plan complete';
    }
    if (fsSync.existsSync(tfPlanFile)) {
      try {
        const showRes = await execInWorkspace(`${tfBin} show -json tfplan`, effectiveDir, env);
        if (showRes.stdout && showRes.stdout.trim().startsWith('{')) {
          await fs.writeFile(tfPlanJsonFile, showRes.stdout, 'utf8');
          planJsonPath = tfPlanJsonFile;
        }
      } catch {}
    }
  };

  try {
    await runPlanWithOut();
  } catch (e: any) {
    const errOut = (e.stdout || '') + (e.stderr || e.message);
    if (errOut.includes('init') || errOut.includes('Plugin')) {
      try {
        await execInWorkspace(`${tfBin} init -backend=false`, effectiveDir, env, { allowNetwork: true });
        await runPlanWithOut();
        planSuccess = true;
      } catch (retryErr: any) {
        planSuccess = false;
        const retryOut = (retryErr.stdout || '') + (retryErr.stderr || retryErr.message);
        planSummary = retryOut.trim().split('\n')[0].slice(0, 80) || 'Requires provider credentials for full plan';
      }
    } else {
      planSuccess = false;
      const firstLine = errOut.trim().split('\n')[0].slice(0, 80);
      planSummary = firstLine || 'Requires provider credentials for full plan';
    }
  }

  // 4. Trivy config scan (preferring resolved tfplan.json, falling back to static workspace)
  let trivySuccess = true;
  let scannerUsed: 'trivy' | 'tfsec' | 'unavailable' = 'trivy';
  const securityFindings: SecurityFinding[] = [];
  const scanTarget = planJsonPath ? 'tfplan.json' : '.';
  const planJsonScanned = Boolean(planJsonPath);

  try {
    let secStdout = '';
    try {
      const res = await execInWorkspace(`${trivyBin} config ${scanTarget} --format json --quiet`, effectiveDir, env);
      secStdout = res.stdout;
    } catch (e: any) {
      const errMsg = (e.stderr || e.message || '').toLowerCase();
      if (errMsg.includes('not recognized') || errMsg.includes('not found') || errMsg.includes('enoent')) {
        // Fallback to tfsec if trivy is not yet installed
        scannerUsed = 'tfsec';
        try {
          const tfsecRes = await execInWorkspace(`${tfsecBin} . --format json --no-colour`, effectiveDir, env);
          secStdout = tfsecRes.stdout;
        } catch (tfsecErr: any) {
          const tfsecMsg = (tfsecErr.stderr || tfsecErr.message || '').toLowerCase();
          if (tfsecMsg.includes('not recognized') || tfsecMsg.includes('not found') || tfsecMsg.includes('enoent')) {
            scannerUsed = 'unavailable';
          } else {
            secStdout = tfsecErr.stdout || '';
          }
        }
      } else {
        secStdout = e.stdout || '';
      }
    }

    if (scannerUsed === 'trivy' && secStdout) {
      securityFindings.push(...parseTrivyJsonOutput(secStdout, cleanTarget));
    } else if (scannerUsed === 'tfsec' && secStdout) {
      const jsonStart = secStdout.indexOf('{');
      const jsonEnd = secStdout.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(secStdout.slice(jsonStart, jsonEnd + 1));
        if (Array.isArray(parsed.results)) {
          for (const r of parsed.results) {
            const findingFile = r.location?.filename ? path.basename(r.location.filename) : 'main.tf';
            if (!cleanTarget || findingFile === fileBasename) {
              securityFindings.push({
                id: r.rule_id || 'tfsec-rule',
                rule_id: r.rule_id || '',
                severity: (r.severity || 'MEDIUM').toUpperCase(),
                description: r.description || r.rule_description || 'Security misconfiguration detected',
                resource: r.resource || '',
                filename: findingFile,
                startLine: r.location?.start_line || 1,
                endLine: r.location?.end_line || 1,
                resolution: r.resolution || 'Apply recommended secure configuration attributes.',
                explanation: r.explanation || '',
                links: r.links || []
              });
            }
          }
        }
      }
    }
    trivySuccess = securityFindings.length === 0;
  } catch {
    trivySuccess = false;
  } finally {
    // Clean up temporary plan artifacts
    try { if (fsSync.existsSync(tfPlanFile)) await fs.unlink(tfPlanFile); } catch {}
    try { if (fsSync.existsSync(tfPlanJsonFile)) await fs.unlink(tfPlanJsonFile); } catch {}
  }

  // 5. infracost check
  let infracostSummary: InfracostSummary = { totalMonthlyCost: '$0.00', currency: 'USD' };
  try {
    const res = await execInWorkspace(`${infracostBin} breakdown --path . --format json`, effectiveDir, env, { allowNetwork: true });
    const jsonStart = res.stdout.indexOf('{');
    const jsonEnd = res.stdout.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const parsed = JSON.parse(res.stdout.slice(jsonStart, jsonEnd + 1));
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
      infracostSummary = {
        totalMonthlyCost: parsed.totalMonthlyCost ? `$${parseFloat(parsed.totalMonthlyCost).toFixed(2)}` : '$0.00',
        totalHourlyCost: parsed.totalHourlyCost ? `$${parseFloat(parsed.totalHourlyCost).toFixed(4)}` : '$0.00',
        currency: parsed.currency || 'USD',
        resources
      };
    }
  } catch (e: any) {
    const errText = (e.stdout || '') + (e.stderr || '');
    if (errText.includes('INFRACOST_API_KEY')) {
      infracostSummary = { apiKeyRequired: true, message: 'Infracost API key required.' };
    }
  }

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const criticalSecCount = securityFindings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;

  let overallStatus: 'passed' | 'warning' | 'error' = 'passed';
  if (errorCount > 0 || criticalSecCount > 0) {
    overallStatus = 'error';
  } else if (diagnostics.length > 0 || securityFindings.length > 0) {
    overallStatus = 'warning';
  }

  return {
    filename: fileBasename,
    tfBinary: activeTfBinary,
    sandboxed,
    scanner: scannerUsed,
    planJsonScanned,
    fmt: { success: fmtSuccess, formatted: isFormatted, output: fmtOutput },
    validate: { success: valSuccess, errorCount, warningCount: diagnostics.length - errorCount, diagnostics },
    trivy: { success: trivySuccess, issueCount: securityFindings.length, findings: securityFindings, scanner: scannerUsed, planJsonScanned },
    tfsec: { success: trivySuccess, issueCount: securityFindings.length, findings: securityFindings },
    infracost: infracostSummary,
    plan: { success: planSuccess, summary: planSummary },
    overallStatus
  };
}

export async function writeWorkspaceFile(
  filename: string,
  content: string,
  options?: { skipVerify?: boolean }
): Promise<{
  path: string;
  relPath: string;
  fmtOutput?: string;
  validateOutput?: string;
  verification?: FileVerificationResult;
}> {
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

  // Automatic Pre-flight Gate: fmt + validate + trivy + infracost + plan (skipped during batch writes)
  let verification: FileVerificationResult | undefined;
  if (!options?.skipVerify && cleanRelPath.endsWith('.tf')) {
    try {
      verification = await verifyWorkspaceFile(cleanRelPath);
    } catch (e) {
      console.warn('[Workspace] verifyWorkspaceFile notification:', e);
    }
  }

  return {
    path: targetPath,
    relPath: cleanRelPath,
    fmtOutput: verification?.fmt.output || 'Success (Formatted cleanly)',
    validateOutput: verification?.validate.success ? 'Success (Configuration is valid)' : 'Validation issues detected',
    verification
  };
}

export async function runTerraformCommand(
  action: 'init' | 'fmt' | 'validate' | 'plan' | 'trivy' | 'tfsec' | 'infracost' | 'verify',
  targetFile?: string
): Promise<TerraformCommandResult> {
  await ensureWorkspace();
  const env = getAugmentedEnv();

  const tfBin = resolveBinary(getTfBinary());
  const trivyBin = resolveBinary('trivy');
  const tfsecBin = resolveBinary('tfsec');
  const infracostBin = resolveBinary('infracost');

  const cleanTarget = targetFile ? targetFile.replace(/^[\\\/]+/, '') : '';

  const effectiveDir = await resolveEffectiveDirectory(cleanTarget);

  if (action === 'verify') {
    const verification = await verifyWorkspaceFile(cleanTarget);
    const summary = `Full Verification Gate (${verification.filename}) [${verification.tfBinary || 'terraform'}${verification.sandboxed ? ' • Docker Sandbox' : ''}]:\n` +
      `• fmt: ${verification.fmt.success ? (verification.fmt.formatted ? 'Formatted' : 'Clean') : 'Failed'}\n` +
      `• validate: ${verification.validate.success ? 'Valid' : `${verification.validate.errorCount} Error(s)`}\n` +
      `• ${verification.scanner || 'trivy'}: ${verification.tfsec.issueCount === 0 ? '0 Security Issues' : `${verification.tfsec.issueCount} Issue(s)`}${verification.planJsonScanned ? ' (via resolved tfplan.json)' : ''}\n` +
      `• infracost: ${verification.infracost.totalMonthlyCost || 'N/A'}/mo\n` +
      `• plan: ${verification.plan.summary}`;

    return {
      success: verification.overallStatus === 'passed',
      output: summary,
      findings: verification.tfsec.findings,
      validationFindings: verification.validate.diagnostics,
      costSummary: verification.infracost,
      verification
    };
  }

  if (action === 'trivy' || action === 'tfsec') {
    let rawStdout = '';
    let rawStderr = '';
    let hasError = false;
    let scannerUsed: 'trivy' | 'tfsec' | 'unavailable' = 'trivy';

    try {
      const res = await execInWorkspace(`${trivyBin} config . --format json --quiet`, effectiveDir, env);
      rawStdout = res.stdout;
      rawStderr = res.stderr;
    } catch (e: any) {
      const errMsg = (e.stderr || e.message || '').toLowerCase();
      if (errMsg.includes('not recognized') || errMsg.includes('not found') || errMsg.includes('enoent')) {
        scannerUsed = 'tfsec';
        try {
          const tfsecRes = await execInWorkspace(`${tfsecBin} . --format json --no-colour`, effectiveDir, env);
          rawStdout = tfsecRes.stdout;
          rawStderr = tfsecRes.stderr;
        } catch (tfsecErr: any) {
          const tfsecMsg = (tfsecErr.stderr || tfsecErr.message || '').toLowerCase();
          if (tfsecMsg.includes('not recognized') || tfsecMsg.includes('not found') || tfsecMsg.includes('enoent')) {
            scannerUsed = 'unavailable';
          }
          rawStdout = tfsecErr.stdout || '';
          rawStderr = tfsecErr.stderr || tfsecErr.message;
          hasError = true;
        }
      } else {
        rawStdout = e.stdout || '';
        rawStderr = e.stderr || e.message;
        hasError = true;
      }
    }

    const fullRaw = (rawStdout + '\n' + rawStderr).trim();
    let findings: SecurityFinding[] = [];

    if (scannerUsed === 'trivy') {
      findings = parseTrivyJsonOutput(rawStdout, cleanTarget);
    } else if (scannerUsed === 'tfsec') {
      try {
        const jsonStart = rawStdout.indexOf('{');
        const jsonEnd = rawStdout.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const parsed = JSON.parse(rawStdout.slice(jsonStart, jsonEnd + 1));
          if (Array.isArray(parsed.results)) {
            for (const r of parsed.results) {
              const findingFile = r.location?.filename ? path.basename(r.location.filename) : 'main.tf';
              if (!cleanTarget || findingFile === path.basename(cleanTarget)) {
                findings.push({
                  id: r.rule_id || 'tfsec-rule',
                  rule_id: r.rule_id || '',
                  severity: (r.severity || 'MEDIUM').toUpperCase(),
                  description: r.description || r.rule_description || 'Security misconfiguration detected',
                  resource: r.resource || '',
                  filename: findingFile,
                  startLine: r.location?.start_line || 1,
                  endLine: r.location?.end_line || 1,
                  resolution: r.resolution || 'Apply recommended secure configuration attributes.',
                  explanation: r.explanation || '',
                  links: r.links || []
                });
              }
            }
          }
        }
      } catch {}
    }

    const cleanDisplayOutput =
      scannerUsed === 'unavailable'
        ? 'Neither trivy nor tfsec binary was found on PATH. Install Trivy (https://trivy.dev) to enable IaC, K8s, Dockerfile, and secret scanning.'
        : findings.length > 0
        ? `${scannerUsed} scan complete: found ${findings.length} security finding(s)${cleanTarget ? ` in ${cleanTarget}` : ''}.\n\n` +
          findings.map(f => `[${f.severity}] ${f.id} (${f.filename}:${f.startLine}) -> ${f.description}`).join('\n')
        : fullRaw || `${scannerUsed} scan completed: 0 security vulnerabilities found.`;

    return {
      success: findings.length === 0 && !hasError && scannerUsed !== 'unavailable',
      output: cleanDisplayOutput,
      findings
    };
  }

  if (action === 'validate') {
    let rawStdout = '';
    let rawStderr = '';
    let isSuccess = true;

    try {
      const res = await execPromise(`${tfBin} validate -json`, { cwd: effectiveDir, env });
      rawStdout = res.stdout;
      rawStderr = res.stderr;
    } catch (e: any) {
      rawStdout = e.stdout || '';
      rawStderr = e.stderr || e.message;
      if (rawStderr.includes('init') || rawStdout.includes('init') || rawStderr.includes('Plugin')) {
        try {
          await execPromise(`${tfBin} init -backend=false`, { cwd: effectiveDir, env });
          const retryRes = await execPromise(`${tfBin} validate -json`, { cwd: effectiveDir, env });
          rawStdout = retryRes.stdout;
          rawStderr = retryRes.stderr;
          isSuccess = true;
        } catch (retryErr: any) {
          rawStdout = retryErr.stdout || '';
          rawStderr = retryErr.stderr || retryErr.message;
          isSuccess = false;
        }
      } else {
        isSuccess = false;
      }
    }

    let validationFindings: ValidationFinding[] = [];
    try {
      const jsonStart = rawStdout.indexOf('{');
      const jsonEnd = rawStdout.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(rawStdout.slice(jsonStart, jsonEnd + 1));
        if (Array.isArray(parsed.diagnostics)) {
          for (const d of parsed.diagnostics) {
            const diagFile = d.range?.filename ? path.basename(d.range.filename) : undefined;
            if (!cleanTarget || !diagFile || diagFile === path.basename(cleanTarget)) {
              validationFindings.push({
                severity: d.severity || 'error',
                summary: d.summary || 'Validation Issue',
                detail: d.detail || '',
                filename: diagFile,
                startLine: d.range?.start?.line
              });
            }
          }
        }
      }
    } catch {}

    const textOutput = validationFindings.length > 0
      ? `terraform validate: ${validationFindings.length} issue(s) detected${cleanTarget ? ` in ${cleanTarget}` : ''}.\n\n` +
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
      const res = await execPromise(`${infracostBin} breakdown --path . --format json`, { cwd: effectiveDir, env });
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
  if (action === 'fmt' && cleanTarget) {
    cmd = `${tfBin} fmt "${path.resolve(WORKSPACE_PATH, cleanTarget)}"`;
  } else if (action === 'init') {
    cmd = `${tfBin} init -backend=false`;
  } else if (action === 'plan') {
    cmd = `${tfBin} plan -no-color -compact-warnings`;
  }

  try {
    const { stdout, stderr } = await execPromise(cmd, { cwd: effectiveDir, env });
    return {
      success: true,
      output: (stdout + '\n' + (stderr || '')).trim()
    };
  } catch (error: any) {
    const errText = (error.stdout || '') + '\n' + (error.stderr || error.message);
    if (action === 'plan' && (errText.includes('init') || errText.includes('Plugin'))) {
      try {
        await execPromise(`${tfBin} init -backend=false`, { cwd: effectiveDir, env });
        const retryRes = await execPromise(`${tfBin} plan -no-color -compact-warnings`, { cwd: effectiveDir, env });
        return {
          success: true,
          output: (retryRes.stdout + '\n' + (retryRes.stderr || '')).trim()
        };
      } catch (retryError: any) {
        return {
          success: false,
          output: (retryError.stdout || '') + '\n' + (retryError.stderr || retryError.message)
        };
      }
    }
    return {
      success: false,
      output: errText.trim()
    };
  }
}
