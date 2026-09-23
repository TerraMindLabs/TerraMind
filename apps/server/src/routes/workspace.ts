import { FastifyInstance } from 'fastify';
import {
  WORKSPACE_PATH,
  listWorkspaceFiles,
  writeWorkspaceFile,
  runTerraformCommand
} from '../services/terraform';
import { isOllamaRunning, startOllamaDaemon } from '../services/ollama';

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

  // 4. Start local Ollama daemon
  fastify.post('/api/ollama/start', async (request, reply) => {
    try {
      const started = await startOllamaDaemon();
      return { online: started };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to start Ollama server' });
    }
  });
}
