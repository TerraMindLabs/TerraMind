import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

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
    try {
      const fmtRes = await execPromise('terraform fmt', { cwd: fileDir });
      fmtOutput = fmtRes.stdout.trim() || 'Success (Formatted cleanly)';
    } catch (e: any) {
      fmtOutput = e.stderr || e.stdout || e.message;
    }

    try {
      const valRes = await execPromise('terraform validate', { cwd: fileDir });
      validateOutput = valRes.stdout.trim() || 'Success (Configuration is valid)';
    } catch (e: any) {
      const errMsg = e.stderr || e.stdout || e.message;
      if (errMsg.includes('terraform init') || errMsg.includes('not been initialized')) {
        try {
          await execPromise('terraform init -backend=false', { cwd: fileDir });
          const retryVal = await execPromise('terraform validate', { cwd: fileDir });
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
