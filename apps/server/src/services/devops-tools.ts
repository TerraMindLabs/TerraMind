import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  WORKSPACE_PATH,
  ensureWorkspace,
  resolveEffectiveDirectory,
  getTfBinary,
  execInWorkspace,
  verifyWorkspaceFile
} from './terraform';
import { getSetting } from '../db';

const execPromise = promisify(exec);

export interface ToolFinding {
  tool: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'ERROR' | 'WARNING' | 'INFO';
  ruleId: string;
  message: string;
  filename?: string;
  line?: number;
  resolution?: string;
}

export interface DevOpsToolResult {
  success: boolean;
  tool: string;
  installed: boolean;
  output: string;
  findings: ToolFinding[];
  rawJson?: any;
  mermaid?: string;
  markdown?: string;
}

export interface CliToolStatus {
  id: string;
  name: string;
  category: 'iac' | 'security' | 'finops' | 'k8s' | 'cicd' | 'gitops';
  targetAgents: string[];
  installed: boolean;
  version?: string;
  description: string;
}

async function checkSingleBinary(cmd: string, args = '--version'): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout, stderr } = await execPromise(`${cmd} ${args}`, { timeout: 3000 });
    const firstLine = (stdout || stderr || '').trim().split('\n')[0]?.slice(0, 80);
    return { installed: true, version: firstLine || 'installed' };
  } catch (e: any) {
    const out = (e.stdout || e.stderr || '').trim();
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('not recognized') || msg.includes('not found') || msg.includes('enoent')) {
      return { installed: false };
    }
    if (out && !out.toLowerCase().includes('not recognized') && !out.toLowerCase().includes('not found')) {
      return { installed: true, version: out.split('\n')[0]?.slice(0, 80) };
    }
    return { installed: false };
  }
}

export async function checkCliToolchain(): Promise<CliToolStatus[]> {
  const specs: Array<{
    id: string;
    name: string;
    cmd: string;
    args?: string;
    category: CliToolStatus['category'];
    targetAgents: string[];
    description: string;
  }> = [
    { id: 'terraform', name: 'Terraform', cmd: 'terraform', args: 'version', category: 'iac', targetAgents: ['Terraform Expert'], description: 'HashiCorp Terraform CLI' },
    { id: 'tofu', name: 'OpenTofu', cmd: 'tofu', args: 'version', category: 'iac', targetAgents: ['Terraform Expert'], description: 'Open-source Terraform fork (BSL-free)' },
    { id: 'trivy', name: 'Trivy', cmd: 'trivy', args: '--version', category: 'security', targetAgents: ['Terraform Expert', 'K8s & GitOps', 'CI/CD Engineer'], description: 'Unified IaC, K8s, Helm, Dockerfile & secret scanner' },
    { id: 'tflint', name: 'TFLint', cmd: 'tflint', args: '--version', category: 'iac', targetAgents: ['Terraform Expert'], description: 'Provider-specific Terraform linter' },
    { id: 'checkov', name: 'Checkov', cmd: 'checkov', args: '--version', category: 'security', targetAgents: ['Terraform Expert', 'CI/CD Engineer'], description: 'Graph-based IaC & GitHub Actions security scanner' },
    { id: 'conftest', name: 'Conftest (OPA)', cmd: 'conftest', args: '--version', category: 'security', targetAgents: ['All Agents'], description: 'Rego policy enforcement gate' },
    { id: 'infracost', name: 'Infracost', cmd: 'infracost', args: '--version', category: 'finops', targetAgents: ['FinOps Optimizer'], description: 'Deterministic cloud cost estimation' },
    { id: 'kubeconform', name: 'kubeconform', cmd: 'kubeconform', args: '-v', category: 'k8s', targetAgents: ['K8s & GitOps'], description: 'Kubernetes manifest OpenAPI schema validator' },
    { id: 'helm', name: 'Helm', cmd: 'helm', args: 'version --short', category: 'k8s', targetAgents: ['K8s & GitOps'], description: 'Helm chart linter and packager' },
    { id: 'actionlint', name: 'actionlint', cmd: 'actionlint', args: '-version', category: 'cicd', targetAgents: ['CI/CD Engineer'], description: 'GitHub Actions workflow static analyzer' },
    { id: 'terraform-docs', name: 'terraform-docs', cmd: 'terraform-docs', args: '--version', category: 'iac', targetAgents: ['Terraform Expert'], description: 'Auto-generates module input/output Markdown docs' },
    { id: 'docker', name: 'Docker', cmd: 'docker', args: '--version', category: 'gitops', targetAgents: ['All Agents'], description: 'Ephemeral rootless sandbox runtime' },
    { id: 'git', name: 'Git', cmd: 'git', args: '--version', category: 'gitops', targetAgents: ['All Agents'], description: 'GitOps branch, commit & PR automation' }
  ];

  const results = await Promise.all(
    specs.map(async (s) => {
      const status = await checkSingleBinary(s.cmd, s.args);
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        targetAgents: s.targetAgents,
        installed: status.installed,
        version: status.version,
        description: s.description
      };
    })
  );

  return results;
}

export async function installMissingCliTools(): Promise<{
  success: boolean;
  installed: string[];
  failed: Array<{ tool: string; error: string }>;
  message: string;
}> {
  if (process.platform === 'win32') {
    return {
      success: false,
      installed: [],
      failed: [],
      message: 'On Windows, run: winget install AquaSecurity.Trivy TerraformLinters.tflint Infracost.Infracost terraform-docs.terraform-docs Helm.Helm'
    };
  }

  const current = await checkCliToolchain();
  const missing = new Set(current.filter((t) => !t.installed).map((t) => t.id));
  const installed: string[] = [];
  const failed: Array<{ tool: string; error: string }> = [];

  const installScriptMap: Record<string, string> = {
    trivy: 'mkdir -p "$HOME/.local/bin" && curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b "$HOME/.local/bin"',
    tflint: 'mkdir -p "$HOME/.local/bin" && curl -sfL https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | TFLINT_INSTALL_PATH="$HOME/.local/bin" bash',
    kubeconform: 'mkdir -p "$HOME/.local/bin" && curl -sfL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar -xz -C "$HOME/.local/bin" kubeconform',
    'terraform-docs': 'mkdir -p "$HOME/.local/bin" && curl -sfL https://terraform-docs.io/dl/v0.19.0/terraform-docs-v0.19.0-linux-amd64.tar.gz | tar -xz -C "$HOME/.local/bin" terraform-docs',
    conftest: 'mkdir -p "$HOME/.local/bin" && curl -sfL https://github.com/open-policy-agent/conftest/releases/download/v0.56.0/conftest_0.56.0_Linux_x86_64.tar.gz | tar -xz -C "$HOME/.local/bin" conftest',
    actionlint: 'mkdir -p "$HOME/.local/bin" && curl -sfL https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash | bash -s -- latest "$HOME/.local/bin"',
    helm: 'curl -sfL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | HELM_INSTALL_DIR="$HOME/.local/bin" USE_SUDO=false bash',
    checkov: 'pip3 install --user --quiet checkov || pip install --user --quiet checkov'
  };

  for (const [tool, cmd] of Object.entries(installScriptMap)) {
    if (!missing.has(tool)) continue;
    try {
      await execPromise(cmd, { timeout: 90000 });
      installed.push(tool);
    } catch (e: any) {
      failed.push({ tool, error: (e.stderr || e.message || 'Install failed').slice(0, 120) });
    }
  }

  return {
    success: failed.length === 0,
    installed,
    failed,
    message:
      installed.length > 0
        ? `Installed ${installed.join(', ')} into ~/.local/bin.`
        : failed.length > 0
        ? `Some tools could not be auto-installed: ${failed.map((f) => f.tool).join(', ')}`
        : 'All supported DevOps CLIs are already installed!'
  };
}

function isBinaryMissingError(err: any): boolean {
  const msg = ((err?.stderr || '') + ' ' + (err?.message || '')).toLowerCase();
  return msg.includes('not recognized') || msg.includes('not found') || msg.includes('enoent');
}

function safeParseJson(raw: string): any {
  const objStart = raw.indexOf('{');
  const arrStart = raw.indexOf('[');
  let start = -1;
  let end = -1;
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    start = objStart;
    end = raw.lastIndexOf('}');
  } else if (arrStart !== -1) {
    start = arrStart;
    end = raw.lastIndexOf(']');
  }
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return null;
}

export async function runTflint(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  let raw = '';
  try {
    const res = await execInWorkspace('tflint --format json', effectiveDir, process.env);
    raw = res.stdout;
  } catch (e: any) {
    if (isBinaryMissingError(e)) {
      return { success: false, tool: 'tflint', installed: false, output: 'tflint binary is not installed on PATH.', findings: [] };
    }
    raw = e.stdout || e.stderr || '';
  }

  const parsed = safeParseJson(raw);
  const findings: ToolFinding[] = [];
  if (parsed && Array.isArray(parsed.issues)) {
    for (const issue of parsed.issues) {
      findings.push({
        tool: 'tflint',
        severity: String(issue.rule?.severity || 'warning').toUpperCase() === 'ERROR' ? 'ERROR' : 'WARNING',
        ruleId: issue.rule?.name || 'tflint-rule',
        message: issue.message || 'TFLint issue',
        filename: issue.range?.filename ? path.basename(issue.range.filename) : undefined,
        line: issue.range?.start?.line
      });
    }
  }

  const output = findings.length > 0
    ? `TFLint found ${findings.length} issue(s):\n` + findings.map(f => `[${f.severity}] ${f.ruleId} (${f.filename || 'tf'}:${f.line || 1}): ${f.message}`).join('\n')
    : 'TFLint passed: 0 issues detected.';

  return { success: findings.length === 0, tool: 'tflint', installed: true, output, findings, rawJson: parsed };
}

export async function runCheckov(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  let raw = '';
  try {
    const res = await execInWorkspace('checkov -d . -o json --quiet --compact', effectiveDir, process.env);
    raw = res.stdout;
  } catch (e: any) {
    if (isBinaryMissingError(e)) {
      return { success: false, tool: 'checkov', installed: false, output: 'checkov binary is not installed on PATH.', findings: [] };
    }
    raw = e.stdout || e.stderr || '';
  }

  const parsed = safeParseJson(raw);
  const findings: ToolFinding[] = [];
  const reports = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  for (const rep of reports) {
    const failed = rep?.results?.failed_checks || [];
    for (const c of failed) {
      findings.push({
        tool: 'checkov',
        severity: (String(c.severity || 'HIGH').toUpperCase() as any) || 'HIGH',
        ruleId: c.check_id || 'CKV',
        message: c.check_name || 'Checkov policy violation',
        filename: c.file_path ? path.basename(c.file_path) : undefined,
        line: Array.isArray(c.file_line_range) ? c.file_line_range[0] : undefined,
        resolution: c.guideline || undefined
      });
    }
  }

  const output = findings.length > 0
    ? `Checkov found ${findings.length} failed check(s):\n` + findings.map(f => `[${f.severity}] ${f.ruleId} (${f.filename || 'workspace'}:${f.line || 1}): ${f.message}`).join('\n')
    : 'Checkov passed: 0 policy violations.';

  return { success: findings.length === 0, tool: 'checkov', installed: true, output, findings, rawJson: parsed };
}

export async function runConftest(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  const policyDir = path.join(effectiveDir, 'policy');

  // Ensure a sensible default baseline Rego policy exists if user hasn't defined one yet
  if (!fsSync.existsSync(policyDir)) {
    const rootPolicyDir = path.join(WORKSPACE_PATH, 'policy');
    if (!fsSync.existsSync(rootPolicyDir)) {
      await fs.mkdir(rootPolicyDir, { recursive: true });
      await fs.writeFile(
        path.join(rootPolicyDir, 'terramind_baseline.rego'),
        `package main\n\n# Warn if Terraform resources lack tags\nwarn[msg] {\n  resource := input.resource_changes[_]\n  not resource.change.after.tags\n  msg := sprintf("Resource %s has no tags defined", [resource.address])\n}\n`,
        'utf8'
      );
    }
  }

  const activePolicyDir = fsSync.existsSync(policyDir) ? policyDir : path.join(WORKSPACE_PATH, 'policy');
  const target = targetFile ? `"${path.resolve(WORKSPACE_PATH, targetFile.replace(/^[\\\/]+/, ''))}"` : '.';
  let raw = '';
  try {
    const res = await execInWorkspace(`conftest test ${target} --policy "${activePolicyDir}" -o json`, effectiveDir, process.env);
    raw = res.stdout;
  } catch (e: any) {
    if (isBinaryMissingError(e)) {
      return { success: false, tool: 'conftest', installed: false, output: 'conftest binary is not installed on PATH.', findings: [] };
    }
    raw = e.stdout || e.stderr || '';
  }

  const parsed = safeParseJson(raw);
  const findings: ToolFinding[] = [];
  const items = Array.isArray(parsed) ? parsed : [];
  for (const item of items) {
    for (const f of item.failures || []) {
      findings.push({ tool: 'conftest', severity: 'ERROR', ruleId: 'opa-deny', message: f.msg || 'Policy denied', filename: item.filename });
    }
    for (const w of item.warnings || []) {
      findings.push({ tool: 'conftest', severity: 'WARNING', ruleId: 'opa-warn', message: w.msg || 'Policy warning', filename: item.filename });
    }
  }

  const output = findings.length > 0
    ? `Conftest OPA evaluated ${items.length} file(s), ${findings.length} finding(s):\n` + findings.map(f => `[${f.severity}] ${f.filename || ''}: ${f.message}`).join('\n')
    : 'Conftest OPA passed: all Rego policies satisfied.';

  return { success: findings.filter(f => f.severity === 'ERROR').length === 0, tool: 'conftest', installed: true, output, findings, rawJson: parsed };
}

export async function runKubeconform(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  const target = targetFile ? `"${path.resolve(WORKSPACE_PATH, targetFile.replace(/^[\\\/]+/, ''))}"` : '.';
  let raw = '';
  try {
    const res = await execInWorkspace(`kubeconform -summary -output json -ignore-missing-schemas ${target}`, effectiveDir, process.env, { allowNetwork: true });
    raw = res.stdout;
  } catch (e: any) {
    if (isBinaryMissingError(e)) {
      return { success: false, tool: 'kubeconform', installed: false, output: 'kubeconform binary is not installed on PATH.', findings: [] };
    }
    raw = e.stdout || e.stderr || '';
  }

  const parsed = safeParseJson(raw);
  const findings: ToolFinding[] = [];
  if (parsed && Array.isArray(parsed.resources)) {
    for (const r of parsed.resources) {
      if (r.status === 'statusInvalid' || r.status === 'statusError') {
        findings.push({
          tool: 'kubeconform',
          severity: 'ERROR',
          ruleId: 'k8s-schema',
          message: r.msg || `Invalid ${r.kind || 'Kubernetes'} manifest`,
          filename: r.filename ? path.basename(r.filename) : undefined
        });
      }
    }
  }

  const output = findings.length > 0
    ? `kubeconform found ${findings.length} schema error(s):\n` + findings.map(f => `[ERROR] ${f.filename || 'k8s'}: ${f.message}`).join('\n')
    : 'kubeconform passed: Kubernetes manifests match OpenAPI schemas.';

  return { success: findings.length === 0, tool: 'kubeconform', installed: true, output, findings, rawJson: parsed };
}

async function findChartDirs(rootDir: string, depth = 0): Promise<string[]> {
  if (depth > 4) return [];
  const chartDirs: string[] = [];
  try {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    if (entries.some((e) => e.isFile() && e.name === 'Chart.yaml')) {
      chartDirs.push(rootDir);
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const sub = await findChartDirs(path.join(rootDir, entry.name), depth + 1);
        chartDirs.push(...sub);
      }
    }
  } catch {}
  return chartDirs;
}

export async function runHelmLint(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  let chartDirs: string[] = [];

  if (targetFile) {
    const clean = targetFile.replace(/^[\\\/]+/, '');
    const fullTarget = path.resolve(WORKSPACE_PATH, clean);
    const candidateDir = fsSync.existsSync(fullTarget) && fsSync.statSync(fullTarget).isDirectory()
      ? fullTarget
      : path.dirname(fullTarget);
    if (fsSync.existsSync(path.join(candidateDir, 'Chart.yaml'))) {
      chartDirs = [candidateDir];
    } else {
      chartDirs = await findChartDirs(candidateDir);
    }
  }

  if (chartDirs.length === 0) {
    chartDirs = await findChartDirs(WORKSPACE_PATH);
  }

  if (chartDirs.length === 0) {
    return {
      success: false,
      tool: 'helm',
      installed: true,
      output: 'No Chart.yaml found in workspace. Generate a Helm chart first (e.g. Chart.yaml, values.yaml, templates/).',
      findings: []
    };
  }

  const outputs: string[] = [];
  const findings: ToolFinding[] = [];
  let allOk = true;

  for (const dir of chartDirs) {
    const relChart = path.relative(WORKSPACE_PATH, dir) || '.';
    let raw = '';
    let ok = true;
    try {
      const res = await execInWorkspace('helm lint .', dir, process.env);
      raw = res.stdout;
    } catch (e: any) {
      if (isBinaryMissingError(e)) {
        return { success: false, tool: 'helm', installed: false, output: 'helm binary is not installed on PATH.', findings: [] };
      }
      raw = (e.stdout || '') + '\n' + (e.stderr || e.message || '');
      ok = false;
    }

    if (!ok) allOk = false;
    outputs.push(`[${relChart}]\n${raw.trim()}`);
    for (const line of raw.split('\n')) {
      if (line.includes('[ERROR]') || line.includes('[WARNING]')) {
        findings.push({
          tool: 'helm',
          severity: line.includes('[ERROR]') ? 'ERROR' : 'WARNING',
          ruleId: 'helm-lint',
          filename: relChart,
          message: line.trim()
        });
      }
    }
  }

  return {
    success: allOk && findings.filter((f) => f.severity === 'ERROR').length === 0,
    tool: 'helm',
    installed: true,
    output: outputs.join('\n\n') || 'Helm lint completed.',
    findings
  };
}

export async function runActionlint(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  let raw = '';
  try {
    const res = await execInWorkspace('actionlint -format "{{json .}}"', effectiveDir, process.env);
    raw = res.stdout;
  } catch (e: any) {
    if (isBinaryMissingError(e)) {
      return { success: false, tool: 'actionlint', installed: false, output: 'actionlint binary is not installed on PATH.', findings: [] };
    }
    raw = e.stdout || e.stderr || '';
  }

  const parsed = safeParseJson(raw);
  const findings: ToolFinding[] = [];
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      findings.push({
        tool: 'actionlint',
        severity: 'ERROR',
        ruleId: item.kind || 'actionlint',
        message: item.message || 'GitHub Actions syntax error',
        filename: item.filepath ? path.basename(item.filepath) : undefined,
        line: item.line
      });
    }
  }

  const output = findings.length > 0
    ? `actionlint found ${findings.length} workflow error(s):\n` + findings.map(f => `[ERROR] ${f.filename || 'workflow'}:${f.line || 1} (${f.ruleId}): ${f.message}`).join('\n')
    : 'actionlint passed: GitHub Actions workflows are valid.';

  return { success: findings.length === 0, tool: 'actionlint', installed: true, output, findings, rawJson: parsed };
}

export async function runTerraformDocs(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  try {
    const res = await execInWorkspace('terraform-docs markdown table .', effectiveDir, process.env);
    return { success: true, tool: 'terraform-docs', installed: true, output: res.stdout.trim(), markdown: res.stdout.trim(), findings: [] };
  } catch (e: any) {
    if (isBinaryMissingError(e)) {
      return { success: false, tool: 'terraform-docs', installed: false, output: 'terraform-docs binary is not installed on PATH.', findings: [] };
    }
    return { success: false, tool: 'terraform-docs', installed: true, output: (e.stderr || e.message || '').trim(), findings: [] };
  }
}

export async function getLiveProviderSchema(resourceType?: string, targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  const tfBin = getTfBinary();
  try {
    const res = await execInWorkspace(`${tfBin} providers schema -json`, effectiveDir, process.env);
    const parsed = safeParseJson(res.stdout);
    if (parsed?.provider_schemas) {
      if (resourceType) {
        for (const [, schema] of Object.entries<any>(parsed.provider_schemas)) {
          const rSchema = schema?.resource_schemas?.[resourceType];
          if (rSchema) {
            const attrs = Object.keys(rSchema.block?.attributes || {});
            return {
              success: true,
              tool: 'schema',
              installed: true,
              output: `Schema for ${resourceType} (${attrs.length} attributes): ${attrs.slice(0, 30).join(', ')}`,
              findings: [],
              rawJson: rSchema
            };
          }
        }
      }
      const providers = Object.keys(parsed.provider_schemas);
      return {
        success: true,
        tool: 'schema',
        installed: true,
        output: `Loaded provider schemas for: ${providers.join(', ')}`,
        findings: [],
        rawJson: { providers }
      };
    }
  } catch {}

  // Fallback: Query public Terraform Registry API for provider metadata
  if (resourceType && resourceType.includes('_')) {
    const provider = resourceType.split('_')[0];
    try {
      const resp = await fetch(`https://registry.terraform.io/v1/providers/hashicorp/${provider}`);
      if (resp.ok) {
        const data = (await resp.json()) as any;
        return {
          success: true,
          tool: 'schema',
          installed: true,
          output: `Registry metadata for hashicorp/${provider}: latest v${data.version} (${data.downloads} downloads)`,
          findings: [],
          rawJson: { provider: data.id, version: data.version, docsUrl: `https://registry.terraform.io/providers/hashicorp/${provider}/latest/docs/resources/${resourceType.slice(provider.length + 1)}` }
        };
      }
    } catch {}
  }

  return { success: false, tool: 'schema', installed: true, output: 'Run terraform init in the workspace to inspect local provider schemas.', findings: [] };
}

export async function generateArchitectureGraph(targetFile?: string): Promise<DevOpsToolResult> {
  await ensureWorkspace();
  const effectiveDir = await resolveEffectiveDirectory(targetFile);
  const tfBin = getTfBinary();
  let dotOutput = '';
  try {
    const res = await execInWorkspace(`${tfBin} graph`, effectiveDir, process.env);
    dotOutput = res.stdout;
  } catch (e: any) {
    dotOutput = e.stdout || '';
  }

  const edges: Array<{ from: string; to: string }> = [];
  const nodes = new Set<string>();
  const edgeRegex = /"([^"]+)"\s*->\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = edgeRegex.exec(dotOutput)) !== null) {
    const from = m[1].replace(/^\[root\]\s*/, '').replace(/\s*\(expand\)$/, '');
    const to = m[2].replace(/^\[root\]\s*/, '').replace(/\s*\(expand\)$/, '');
    if (from === 'meta.count-boundary' || to === 'meta.count-boundary' || from === to) continue;
    nodes.add(from);
    nodes.add(to);
    edges.push({ from, to });
  }

  // Fallback: parse .tf resource blocks directly if `terraform graph` had no init
  if (edges.length === 0) {
    try {
      const entries = await fs.readdir(effectiveDir);
      for (const f of entries) {
        if (!f.endsWith('.tf')) continue;
        const content = await fs.readFile(path.join(effectiveDir, f), 'utf8');
        const resMatches = content.matchAll(/resource\s+"([^"]+)"\s+"([^"]+)"/g);
        for (const rm of resMatches) {
          nodes.add(`${rm[1]}.${rm[2]}`);
        }
      }
    } catch {}
  }

  const sanitizeId = (s: string) => 'n_' + s.replace(/[^a-zA-Z0-9_]/g, '_');
  const lines = ['flowchart TD'];
  for (const n of nodes) {
    lines.push(`  ${sanitizeId(n)}["${n.replace(/"/g, "'")}"]`);
  }
  for (const e of edges.slice(0, 60)) {
    lines.push(`  ${sanitizeId(e.from)} --> ${sanitizeId(e.to)}`);
  }
  if (nodes.size === 0) {
    lines.push('  empty["No Terraform resources found in workspace"]');
  }

  const mermaid = lines.join('\n');
  return {
    success: nodes.size > 0,
    tool: 'graph',
    installed: true,
    output: `Generated architecture graph (${nodes.size} nodes, ${edges.length} dependencies).`,
    mermaid,
    findings: []
  };
}

export async function createGitOpsPullRequest(params: {
  branchName?: string;
  commitMessage?: string;
  prTitle?: string;
  targetBase?: string;
}): Promise<{
  success: boolean;
  branch: string;
  committed: boolean;
  pushed: boolean;
  prUrl?: string;
  summaryMarkdown: string;
  message: string;
}> {
  await ensureWorkspace();
  const branch = (params.branchName || `terramind/iac-${Date.now()}`).replace(/[^a-zA-Z0-9/_-]/g, '-');
  const commitMsg = params.commitMessage || 'feat(iac): add validated TerraMind infrastructure';
  const prTitle = params.prTitle || commitMsg;
  const base = params.targetBase || 'main';

  // Run verification gate for PR summary
  const verification = await verifyWorkspaceFile();
  const summaryMarkdown =
    `## TerraMind Automated Verification Summary\n\n` +
    `- **Engine:** \`${verification.tfBinary || 'terraform'}\` ${verification.sandboxed ? '(Docker Sandboxed)' : ''}\n` +
    `- **Validation:** ${verification.validate.success ? '✅ Passed' : `❌ ${verification.validate.errorCount} error(s)`}\n` +
    `- **Security (${verification.scanner || 'trivy'}):** ${verification.trivy?.issueCount || 0} finding(s)${verification.planJsonScanned ? ' (scanned resolved `tfplan.json`)' : ''}\n` +
    `- **Estimated Monthly Cost (Infracost):** ${verification.infracost.totalMonthlyCost || 'N/A'}\n` +
    `- **Speculative Plan:** \`${verification.plan.summary}\`\n`;

  try {
    await execPromise(`git status`, { cwd: WORKSPACE_PATH });
  } catch {
    return {
      success: false,
      branch,
      committed: false,
      pushed: false,
      summaryMarkdown,
      message: 'Workspace is not a Git repository yet. Initialize git and add a remote origin to push & open a PR.'
    };
  }

  let committed = false;
  let pushed = false;
  let prUrl: string | undefined;

  try {
    await execPromise(`git checkout -B "${branch}"`, { cwd: WORKSPACE_PATH });
    await execPromise(`git add -A`, { cwd: WORKSPACE_PATH });
    try {
      await execPromise(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: WORKSPACE_PATH });
      committed = true;
    } catch {
      committed = false;
    }

    let remoteUrl = '';
    try {
      const r = await execPromise('git remote get-url origin', { cwd: WORKSPACE_PATH });
      remoteUrl = r.stdout.trim();
    } catch {}

    if (remoteUrl) {
      try {
        await execPromise(`git push -u origin "${branch}"`, { cwd: WORKSPACE_PATH });
        pushed = true;
      } catch {}

      const token = getSetting('github_token') || process.env.GITHUB_TOKEN;
      const ghMatch = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/i);
      if (pushed && token && ghMatch) {
        const [, owner, repo] = ghMatch;
        const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: prTitle, head: branch, base, body: summaryMarkdown })
        });
        if (resp.ok) {
          const prData = (await resp.json()) as any;
          prUrl = prData.html_url;
        }
      }
    }

    return {
      success: true,
      branch,
      committed,
      pushed,
      prUrl,
      summaryMarkdown,
      message: prUrl
        ? `Pull Request opened: ${prUrl}`
        : pushed
        ? `Branch ${branch} pushed to origin. Add a GitHub token in Settings to auto-open the PR.`
        : `Committed on local branch ${branch}. Add a git remote 'origin' to push & open a PR.`
    };
  } catch (err: any) {
    return {
      success: false,
      branch,
      committed,
      pushed,
      summaryMarkdown,
      message: err.message || 'GitOps PR workflow failed'
    };
  }
}

/**
 * Runs structured JSON verification for a batch of newly written files and returns
 * compact JSON diagnostics suitable for feeding back to the LLM self-correction loop.
 */
export async function runStructuredVerificationForFiles(
  relPaths: string[]
): Promise<{ hasErrors: boolean; summaryText: string; structuredErrors: any[] }> {
  const structuredErrors: any[] = [];
  const hasTf = relPaths.some((p) => p.endsWith('.tf'));
  const hasK8s = relPaths.some((p) => (p.endsWith('.yaml') || p.endsWith('.yml')) && !p.includes('.github/workflows'));
  const hasWorkflow = relPaths.some((p) => p.includes('.github/workflows') && (p.endsWith('.yml') || p.endsWith('.yaml')));

  if (hasTf) {
    const v = await verifyWorkspaceFile(relPaths.find((p) => p.endsWith('.tf')));
    if (v.validate.errorCount > 0) {
      structuredErrors.push({ tool: 'terraform validate', diagnostics: v.validate.diagnostics });
    }
    const highSec = (v.trivy?.findings || []).filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    if (highSec.length > 0) {
      structuredErrors.push({ tool: v.scanner || 'trivy', findings: highSec.slice(0, 10) });
    }
    const tflint = await runTflint();
    if (tflint.installed && !tflint.success && tflint.findings.some((f) => f.severity === 'ERROR')) {
      structuredErrors.push({ tool: 'tflint', findings: tflint.findings.slice(0, 10) });
    }
  }

  if (hasK8s) {
    const kc = await runKubeconform();
    if (kc.installed && !kc.success) {
      structuredErrors.push({ tool: 'kubeconform', findings: kc.findings.slice(0, 10) });
    }
  }

  if (hasWorkflow) {
    const al = await runActionlint();
    if (al.installed && !al.success) {
      structuredErrors.push({ tool: 'actionlint', findings: al.findings.slice(0, 10) });
    }
  }

  const summaryText = structuredErrors.length > 0 ? JSON.stringify(structuredErrors, null, 2) : '';
  return { hasErrors: structuredErrors.length > 0, summaryText, structuredErrors };
}
