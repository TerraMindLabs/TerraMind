import { FastifyInstance } from 'fastify';
import {
  WORKSPACE_PATH,
  listWorkspaceFiles,
  writeWorkspaceFile,
  runTerraformCommand
} from '../services/terraform';
import { isOllamaRunning, isOllamaInstalled, startOllamaDaemon, installOllama } from '../services/ollama';

export default async function workspaceRoutes(fastify: FastifyInstance) {
  // 1. Get workspace status and file list
  fastify.get('/api/workspace', async (request, reply) => {
    try {
      const files = await listWorkspaceFiles();
      const ollamaActive = await isOllamaRunning();
      return {
        path: WORKSPACE_PATH,
        files,
        ollamaActive
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to inspect workspace' });
    }
  });

  // 2. Run Terraform CLI action (fmt, validate, plan, init)
  fastify.post('/api/workspace/run', async (request, reply) => {
    const { action } = request.body as { action: 'init' | 'fmt' | 'validate' | 'plan' };
    if (!action) {
      return reply.status(400).send({ error: 'action is required (init, fmt, validate, plan)' });
    }

    try {
      const result = await runTerraformCommand(action);
      return result;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to run Terraform action' });
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
      return {
        running,
        installed: info.installed,
        version: info.version,
        path: info.path,
        platform: process.platform
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
