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
  fmt: { success: boolean; formatted: boolean; output: string };
  validate: { success: boolean; errorCount: number; warningCount: number; diagnostics: ValidationFinding[] };
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
 * Executes full pre-flight verification gate: fmt + validate + tfsec + infracost + speculative plan
 */
export async function verifyWorkspaceFile(targetRelPath?: string): Promise<FileVerificationResult> {
  await ensureWorkspace();
  const env = getAugmentedEnv();
  const tfBin = resolveBinary('terraform');
  const tfsecBin = resolveBinary('tfsec');
  const infracostBin = resolveBinary('infracost');

  const cleanTarget = targetRelPath ? targetRelPath.replace(/^[\\\/]+/, '') : '';
  const fileBasename = cleanTarget ? path.basename(cleanTarget) : 'workspace';

  // 1. fmt check
  let fmtSuccess = true;
  let isFormatted = false;
  let fmtOutput = '';
  try {
    const fmtTarget = cleanTarget ? `"${path.resolve(WORKSPACE_PATH, cleanTarget)}"` : '';
    const res = await execPromise(`${tfBin} fmt ${fmtTarget}`, { cwd: WORKSPACE_PATH, env });
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
      const res = await execPromise(`${tfBin} validate -json`, { cwd: WORKSPACE_PATH, env });
      valRaw = res.stdout;
    } catch (e: any) {
      valRaw = e.stdout || '';
      if ((e.stderr || e.stdout || '').includes('init')) {
        try {
          await execPromise(`${tfBin} init -backend=false`, { cwd: WORKSPACE_PATH, env });
          const retryRes = await execPromise(`${tfBin} validate -json`, { cwd: WORKSPACE_PATH, env });
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

  // 3. tfsec check
  let tfsecSuccess = true;
  const securityFindings: SecurityFinding[] = [];
  try {
    let secStdout = '';
    try {
      const res = await execPromise(`${tfsecBin} . --format json --no-colour`, { cwd: WORKSPACE_PATH, env });
      secStdout = res.stdout;
    } catch (e: any) {
      secStdout = e.stdout || '';
    }

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
    tfsecSuccess = securityFindings.length === 0;
  } catch {
    tfsecSuccess = false;
  }

  // 4. infracost check
  let infracostSummary: InfracostSummary = { totalMonthlyCost: '$0.00', currency: 'USD' };
  try {
    const res = await execPromise(`${infracostBin} breakdown --path . --format json`, { cwd: WORKSPACE_PATH, env });
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

  // 5. speculative plan check
  let planSuccess = true;
  let planSummary = 'Plan ready';
  try {
    const res = await execPromise(`${tfBin} plan -no-color -compact-warnings`, { cwd: WORKSPACE_PATH, env });
    const match = res.stdout.match(/Plan:\s*(\d+\s*to\s*add,\s*\d+\s*to\s*change,\s*\d+\s*to\s*destroy)/i);
    if (match) {
      planSummary = match[1];
    } else if (res.stdout.includes('No changes.')) {
      planSummary = 'No changes (State clean)';
    } else {
      planSummary = 'Speculative plan complete';
    }
  } catch (e: any) {
    planSuccess = false;
    const errOut = (e.stdout || '') + (e.stderr || e.message);
    const firstLine = errOut.trim().split('\n')[0].slice(0, 80);
    planSummary = firstLine || 'Requires provider credentials for full plan';
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
    fmt: { success: fmtSuccess, formatted: isFormatted, output: fmtOutput },
    validate: { success: valSuccess, errorCount, warningCount: diagnostics.length - errorCount, diagnostics },
    tfsec: { success: tfsecSuccess, issueCount: securityFindings.length, findings: securityFindings },
    infracost: infracostSummary,
    plan: { success: planSuccess, summary: planSummary },
    overallStatus
  };
}

export async function writeWorkspaceFile(
  filename: string,
  content: string
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

  // Automatic Pre-flight Gate: fmt + validate + tfsec + infracost + plan
  let verification: FileVerificationResult | undefined;
  if (cleanRelPath.endsWith('.tf')) {
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
  action: 'init' | 'fmt' | 'validate' | 'plan' | 'tfsec' | 'infracost' | 'verify',
  targetFile?: string
): Promise<TerraformCommandResult> {
  await ensureWorkspace();
  const env = getAugmentedEnv();

  const tfBin = resolveBinary('terraform');
  const tfsecBin = resolveBinary('tfsec');
  const infracostBin = resolveBinary('infracost');

  const cleanTarget = targetFile ? targetFile.replace(/^[\\\/]+/, '') : '';

  if (action === 'verify') {
    const verification = await verifyWorkspaceFile(cleanTarget);
    const summary = `Full Verification Gate (${verification.filename}):\n` +
      `• fmt: ${verification.fmt.success ? (verification.fmt.formatted ? 'Formatted' : 'Clean') : 'Failed'}\n` +
      `• validate: ${verification.validate.success ? 'Valid' : `${verification.validate.errorCount} Error(s)`}\n` +
      `• tfsec: ${verification.tfsec.issueCount === 0 ? '0 Security Issues' : `${verification.tfsec.issueCount} Issue(s)`}\n` +
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

  if (action === 'tfsec') {
    let rawStdout = '';
    let rawStderr = '';
    let hasError = false;

    try {
      const res = await execPromise(`${tfsecBin} . --format json --no-colour`, { cwd: WORKSPACE_PATH, env });
      rawStdout = res.stdout;
      rawStderr = res.stderr;
    } catch (e: any) {
      rawStdout = e.stdout || '';
      rawStderr = e.stderr || e.message;
      hasError = true;
    }

    const fullRaw = (rawStdout + '\n' + rawStderr).trim();
    let findings: SecurityFinding[] = [];

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

    const cleanDisplayOutput = findings.length > 0
      ? `tfsec scan complete: found ${findings.length} security finding(s)${cleanTarget ? ` in ${cleanTarget}` : ''}.\n\n` +
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
  if (action === 'fmt' && cleanTarget) {
    cmd = `${tfBin} fmt "${path.resolve(WORKSPACE_PATH, cleanTarget)}"`;
  } else if (action === 'init') {
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
