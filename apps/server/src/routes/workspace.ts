import { FastifyInstance } from 'fastify';
import {
  WORKSPACE_PATH,
  listWorkspaceFiles,
  writeWorkspaceFile,
  runTerraformCommand,
  verifyWorkspaceFile,
  getExecutionEnvironmentInfo
} from '../services/terraform';
import {
  checkCliToolchain,
  runTflint,
  runCheckov,
  runConftest,
  runKubeconform,
  runHelmLint,
  runActionlint,
  runTerraformDocs,
  getLiveProviderSchema,
  generateArchitectureGraph,
  createGitOpsPullRequest
} from '../services/devops-tools';
import { EVAL_BENCHMARKS, runEvalBenchmarkSuite } from '../services/eval-suite';
import { isOllamaRunning, isOllamaInstalled, startOllamaDaemon, installOllama, getOllamaBaseUrl } from '../services/ollama';
import { getSetting } from '../db';

export default async function workspaceRoutes(fastify: FastifyInstance) {
  // 1. Get workspace status and file list
  fastify.get('/api/workspace', async (request, reply) => {
    try {
      const [files, ollamaActive, executionEnv] = await Promise.all([
        listWorkspaceFiles(),
        isOllamaRunning(),
        getExecutionEnvironmentInfo()
      ]);
      return {
        path: WORKSPACE_PATH,
        files,
        ollamaActive,
        executionEnv
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to inspect workspace' });
    }
  });

  // 2. Run DevOps / Terraform CLI action
  fastify.post('/api/workspace/run', async (request, reply) => {
    const { action, targetFile, resourceType } = request.body as {
      action:
        | 'init'
        | 'fmt'
        | 'validate'
        | 'plan'
        | 'trivy'
        | 'tfsec'
        | 'infracost'
        | 'verify'
        | 'tflint'
        | 'checkov'
        | 'conftest'
        | 'kubeconform'
        | 'helm'
        | 'actionlint'
        | 'terraform-docs'
        | 'schema'
        | 'graph';
      targetFile?: string;
      resourceType?: string;
    };
    if (!action) {
      return reply.status(400).send({ error: 'action is required' });
    }

    try {
      switch (action) {
        case 'tflint':
          return await runTflint(targetFile);
        case 'checkov':
          return await runCheckov(targetFile);
        case 'conftest':
          return await runConftest(targetFile);
        case 'kubeconform':
          return await runKubeconform(targetFile);
        case 'helm':
          return await runHelmLint(targetFile);
        case 'actionlint':
          return await runActionlint(targetFile);
        case 'terraform-docs':
          return await runTerraformDocs(targetFile);
        case 'schema':
          return await getLiveProviderSchema(resourceType, targetFile);
        case 'graph':
          return await generateArchitectureGraph(targetFile);
        default:
          return await runTerraformCommand(action, targetFile);
      }
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to run workspace action' });
    }
  });

  // 2c. Query CLI toolchain installation status
  fastify.get('/api/workspace/tools', async (request, reply) => {
    try {
      const tools = await checkCliToolchain();
      return { tools };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to check CLI toolchain' });
    }
  });

  // 2d. Generate Mermaid architecture graph from workspace
  fastify.get('/api/workspace/graph', async (request, reply) => {
    try {
      const { targetFile } = (request.query as { targetFile?: string }) || {};
      return await generateArchitectureGraph(targetFile);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate architecture graph' });
    }
  });

  // 2e. GitOps / Pull Request Mode
  fastify.post('/api/workspace/gitops/pr', async (request, reply) => {
    try {
      const body = (request.body as {
        branchName?: string;
        commitMessage?: string;
        prTitle?: string;
        targetBase?: string;
      }) || {};
      return await createGitOpsPullRequest(body);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to execute GitOps PR workflow' });
    }
  });

  // 2f. Automated Eval Benchmark Suite
  fastify.get('/api/workspace/evals', async () => {
    return { benchmarks: EVAL_BENCHMARKS };
  });

  fastify.post('/api/workspace/evals/run', async (request, reply) => {
    try {
      const body = (request.body as { provider?: 'ollama' | 'cloud'; model?: string; caseIds?: string[] }) || {};
      return await runEvalBenchmarkSuite(body);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to run eval benchmark suite' });
    }
  });

  // 2b. Full pre-flight verification gate
  fastify.post('/api/workspace/verify', async (request, reply) => {
    const { filename } = (request.body as { filename?: string }) || {};
    try {
      const result = await verifyWorkspaceFile(filename);
      return { success: result.overallStatus === 'passed', verification: result };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to run verification gate' });
    }
  });

  // 3. Save code file into Terraform workspace
  fastify.post('/api/workspace/save', async (request, reply) => {
    const { filename, content } = request.body as { filename: string; content: string };
    if (!filename || content === undefined) {
      return reply.status(400).send({ error: 'filename and content are required' });
    }

    try {
      const result = await writeWorkspaceFile(filename, content);
      return { success: true, ...result };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to save workspace file' });
    }
  });

  // 4. Query Ollama status (installed vs running)
  fastify.get('/api/ollama/status', async (request, reply) => {
    try {
      const running = await isOllamaRunning();
      const info = await isOllamaInstalled();
      const host = getOllamaBaseUrl();
      const autoStart = getSetting('ollama_auto_start') !== 'false';
      return {
        running,
        installed: info.installed,
        version: info.version,
        path: info.path,
        muslIncompatible: Boolean(info.muslIncompatible),
        muslError: info.error || undefined,
        platform: process.platform,
        host,
        autoStart,
        portForwardingReady: true,
        listenBinding: '0.0.0.0:11434'
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to query Ollama status' });
    }
  });

  // 5. Start local Ollama daemon
  fastify.post('/api/ollama/start', async (request, reply) => {
    try {
      const res = await startOllamaDaemon();
      return { online: res.running, ...res };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ online: false, success: false, error: err.message || 'Failed to start Ollama server' });
    }
  });

  // 6. Download & Install Ollama (SSE Streaming)
  fastify.post('/api/ollama/install', async (request, reply) => {
    reply.hijack();
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    const sendEvent = (data: any) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent({ status: 'Starting Ollama automated installation...', log: 'Initializing installer...\n' });

    try {
      const result = await installOllama((chunk) => {
        sendEvent({ log: chunk });
      });

      if (result.success) {
        sendEvent({ success: true, status: 'Ollama installed and active on port 11434!' });
      } else {
        sendEvent({ error: result.error || 'Failed to install Ollama' });
      }
    } catch (err: any) {
      sendEvent({ error: err.message || 'Error executing Ollama installer' });
    } finally {
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    }
  });
}
