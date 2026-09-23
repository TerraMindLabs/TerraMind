import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execPromise = promisify(exec);

export const WORKSPACE_PATH = process.env.TF_WORKSPACE || path.resolve(process.cwd(), '..', '..', 'Terraform');

export async function ensureWorkspace(): Promise<string> {
  try {
    await fs.mkdir(WORKSPACE_PATH, { recursive: true });
  } catch (e) {
    // Ignore if directory already exists
  }
  return WORKSPACE_PATH;
}

export async function listWorkspaceFiles(): Promise<Array<{ name: string; size: number; content?: string }>> {
  await ensureWorkspace();
  const entries = await fs.readdir(WORKSPACE_PATH, { withFileTypes: true });
  const files: Array<{ name: string; size: number; content?: string }> = [];

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.tf') || entry.name.endsWith('.tfvars') || entry.name.endsWith('.json') || entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
      const fullPath = path.join(WORKSPACE_PATH, entry.name);
      const stat = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      files.push({ name: entry.name, size: stat.size, content });
    }
  }

  return files;
}

export async function writeWorkspaceFile(filename: string, content: string): Promise<{ path: string; fmtOutput?: string; validateOutput?: string }> {
  await ensureWorkspace();
  const safeFilename = path.basename(filename);
  const targetPath = path.join(WORKSPACE_PATH, safeFilename);
  await fs.writeFile(targetPath, content, 'utf8');

  // Automatic Agent Action: If writing Terraform HCL, automatically run terraform fmt and terraform validate
  let fmtOutput = '';
  let validateOutput = '';

  if (safeFilename.endsWith('.tf')) {
    try {
      const fmtRes = await execPromise('terraform fmt', { cwd: WORKSPACE_PATH });
      fmtOutput = fmtRes.stdout.trim();
    } catch {
      // Non-fatal
    }

    try {
      const valRes = await execPromise('terraform validate', { cwd: WORKSPACE_PATH });
      validateOutput = valRes.stdout.trim();
    } catch (e: any) {
      validateOutput = e.stderr || e.stdout || e.message;
    }
  }

  return { path: targetPath, fmtOutput, validateOutput };
}

export async function runTerraformCommand(action: 'init' | 'fmt' | 'validate' | 'plan'): Promise<{ success: boolean; output: string }> {
  await ensureWorkspace();

  let cmd = 'terraform fmt';
  if (action === 'init') {
    cmd = 'terraform init -backend=false';
  } else if (action === 'validate') {
    cmd = 'terraform validate';
  } else if (action === 'plan') {
    cmd = 'terraform plan -no-color';
  }

  try {
    const { stdout, stderr } = await execPromise(cmd, { cwd: WORKSPACE_PATH });
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
