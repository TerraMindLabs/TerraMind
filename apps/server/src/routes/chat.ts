import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import {
  createConversation,
  updateConversationAgent,
  getConversations,
  getConversation,
  getMessages,
  addMessage,
  upsertMessage,
  deleteConversation,
  updateConversationTitle,
  getAllSettings,
  getSetting,
  getProjects,
  getProjectById,
  createProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from '../db';
import { buildSystemPrompt } from './agent-prompts';
import { listWorkspaceFiles, writeWorkspaceFile, WORKSPACE_PATH } from '../services/terraform';
import { invokeBedrockConverse, streamAzureFoundry, invokeOciGenAi } from '../services/enterprise-ai';
import { getOllamaBaseUrl, isOllamaRunning, startOllamaDaemon } from '../services/ollama';

interface ChatRequestBody {
  conversationId?: string;
  projectId?: string;
  userId?: string;
  messages: Array<{ role: string; content: string }>;
  provider?: string;
  model?: string;
  agentId?: string;
}

export default async function chatRoutes(fastify: FastifyInstance) {
  // 1. Projects API (Requirement 3: Renamed to Projects, no pre-existing projects seeded)
  fastify.get('/api/projects', async (request, reply) => {
    try {
      const userId = (request.headers['x-user-id'] as string) || (request.query as any)?.userId;
      const projects = getProjects(userId);
      return { projects };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch projects' });
    }
  });

  fastify.post('/api/projects', async (request, reply) => {
    try {
      const userId = (request.headers['x-user-id'] as string) || (request.body as any)?.userId || '';
      const { name, description, icon } = (request.body as any) || {};
      if (!name) {
        return reply.status(400).send({ error: 'Project name is required' });
      }
      const id = 'proj-' + Date.now();
      const proj = createProject(id, name, description || '', icon || '📁', userId);
      return proj;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to create project' });
    }
  });

  fastify.delete('/api/projects/:id', async (request, reply) => {
    try {
      const userId = (request.headers['x-user-id'] as string) || '';
      const { id } = request.params as { id: string };
      deleteProject(id, userId);
      return { success: true };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete project' });
    }
  });

  // 1b. Project Collaboration / Workspace Sharing APIs
  fastify.get('/api/projects/:id/members', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const members = getProjectMembers(id);
      return { members };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch project members' });
    }
  });

  fastify.post('/api/projects/:id/members', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { username, role } = (request.body as any) || {};
      if (!username) {
        return reply.status(400).send({ error: 'Username is required to share project' });
      }
      const member = addProjectMember(id, username.trim(), role || 'editor');
      return { success: true, member };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to add project member' });
    }
  });

  fastify.delete('/api/projects/:id/members/:memberId', async (request, reply) => {
    try {
      const { id, memberId } = request.params as { id: string; memberId: string };
      removeProjectMember(id, memberId);
      return { success: true };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to remove project member' });
    }
  });

  // 2. List conversations (Requirement 4: Full persistent history)
  fastify.get('/api/conversations', async (request, reply) => {
    try {
      const userId = (request.headers['x-user-id'] as string) || (request.query as any)?.userId;
      const { projectId } = request.query as { projectId?: string };
      // If projectId is specifically requested, filter; otherwise return all user conversations
      const convos = getConversations(userId, projectId || undefined);
      return { conversations: convos };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch conversations' });
    }
  });

  // 3. Create conversation
  fastify.post('/api/conversations', async (request, reply) => {
    try {
      const userId = (request.headers['x-user-id'] as string) || (request.body as any)?.userId || '';
      const body = (request.body as any) || {};
      const id = body.id || randomUUID();
      const title = body.title || 'New Infrastructure Chat';
      const provider = body.provider || 'ollama';
      const model = body.model || '';
      const projectId = body.projectId || '';
      const agentId = body.agentId || 'agent_tf-devops-expert';
      const convo = createConversation(id, title, provider, model, projectId, userId, agentId);
      return convo;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to create conversation' });
    }
  });

  // 4. Get messages for a conversation
  fastify.get('/api/conversations/:id/messages', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const messages = getMessages(id);
      return { messages };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch messages' });
    }
  });

  // 5. Delete a conversation
  fastify.delete('/api/conversations/:id', async (request, reply) => {
    try {
      const userId = (request.headers['x-user-id'] as string) || '';
      const { id } = request.params as { id: string };
      deleteConversation(id, userId);
      return { success: true };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete conversation' });
    }
  });

  // 6. Query available models & local Ollama detection
  fastify.get('/api/models', async (request, reply) => {
    let ollamaOnline = false;
    let localModels: string[] = [];

    const baseUrl = getOllamaBaseUrl();
    const hosts = Array.from(new Set([baseUrl, 'http://127.0.0.1:11434', 'http://localhost:11434']));
    for (const host of hosts) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(`${host}/api/tags`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as any;
          ollamaOnline = true;
          localModels = (data.models || []).map((m: any) => m.name);
          break;
        }
      } catch {}
    }

    const settings = getAllSettings();
    const geminiKey = settings['gemini_api_key'] || process.env.GEMINI_API_KEY;
    const openaiKey = settings['openai_api_key'] || process.env.OPENAI_API_KEY;
    const anthropicKey = settings['anthropic_api_key'] || process.env.ANTHROPIC_API_KEY;

    const hasKeys = {
      gemini: Boolean(geminiKey),
      openai: Boolean(openaiKey),
      anthropic: Boolean(anthropicKey)
    };

    const cloudModels: string[] = [];

    // Fetch models via provider APIs only if keys are provided
    if (geminiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, {
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (Array.isArray(data.models)) {
            // Strictly verify that the model supports conversational text chat and generateContent
            const unsupportedKeywords = [
              'tts',
              'image',
              'imagen',
              'audio',
              'realtime',
              'embedding',
              'embed',
              'aqa',
              'retrieval',
              'computer-use',
              'whisper',
              'transcribe'
            ];

            const fetched = data.models
              .filter((m: any) => {
                if (!m || !m.name) return false;
                const name = String(m.name).replace(/^models\//, '').toLowerCase();

                // 1. Must be a Gemini chat model (excludes raw gemma weights or unrelated models)
                if (!name.startsWith('gemini-')) return false;

                // 2. Must support generateContent
                if (!Array.isArray(m.supportedGenerationMethods) || !m.supportedGenerationMethods.includes('generateContent')) {
                  return false;
                }

                // 3. Exclude unsupported modalities (TTS audio, image generation, etc.)
                if (unsupportedKeywords.some((k) => name.includes(k))) {
                  return false;
                }

                return true;
              })
              .map((m: any) => m.name.replace(/^models\//, ''));

            // Sort prioritizing latest working stable models (gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash)
            fetched.sort((a: string, b: string) => {
              const score = (name: string) => {
                if (name === 'gemini-2.5-flash') return 100;
                if (name === 'gemini-2.0-flash') return 95;
                if (name === 'gemini-1.5-flash') return 90;
                if (name === 'gemini-2.5-pro') return 85;
                if (name === 'gemini-2.0-flash-lite') return 80;
                if (name === 'gemini-1.5-pro') return 75;
                if (name.includes('flash')) return 50;
                return 10;
              };
              return score(b) - score(a);
            });

            if (fetched.length > 0) {
              cloudModels.push(...fetched.slice(0, 15));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic Gemini models:', err);
      }
      // If fetching fails or times out, but geminiKey was configured, supply verified default models
      if (!cloudModels.some((m) => m.startsWith('gemini'))) {
        cloudModels.push('gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash');
      }
    }

    if (openaiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${openaiKey}` },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (Array.isArray(data.data)) {
            const unsupported = [
              'realtime',
              'audio',
              'transcribe',
              'tts',
              'image',
              'dall-e',
              'embedding',
              'moderation',
              'search',
              'preview-audio'
            ];

            const fetched = data.data
              .map((m: any) => m.id)
              .filter(
                (id: string) => {
                  if (!id) return false;
                  const lower = id.toLowerCase();
                  if (
                    !lower.startsWith('gpt-4') &&
                    !lower.startsWith('gpt-3.5') &&
                    !lower.startsWith('o1') &&
                    !lower.startsWith('o3') &&
                    !lower.startsWith('chatgpt-')
                  ) {
                    return false;
                  }
                  return !unsupported.some((u) => lower.includes(u));
                }
              )
              .sort();
            if (fetched.length > 0) {
              cloudModels.push(...fetched.slice(0, 10));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic OpenAI models:', err);
      }
      if (!cloudModels.some((m) => m.startsWith('gpt'))) {
        cloudModels.push('gpt-4o', 'gpt-4o-mini');
      }
    }

    if (anthropicKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (Array.isArray(data.data)) {
            const fetched = data.data
              .map((m: any) => m.id)
              .filter((id: string) => id && id.startsWith('claude-'));
            if (fetched.length > 0) {
              cloudModels.push(...fetched.slice(0, 8));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic Anthropic models:', err);
      }
      if (!cloudModels.some((m) => m.startsWith('claude'))) {
        cloudModels.push('claude-3-5-sonnet-20241022');
      }
    }

    // Enterprise Cloud AI: Azure AI Foundry
    if (settings['azure_openai_endpoint'] && settings['azure_openai_api_key']) {
      const dep = settings['azure_openai_deployment'] || 'gpt-4o';
      cloudModels.push(`azure/${dep}`);
    }

    // Enterprise Cloud AI: AWS Bedrock
    if (settings['aws_bedrock_access_key'] && settings['aws_bedrock_secret_key']) {
      const bModel = settings['aws_bedrock_model'] || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
      cloudModels.push(`bedrock/${bModel}`);
      if (!cloudModels.includes('bedrock/amazon.nova-pro-v1:0')) {
        cloudModels.push('bedrock/amazon.nova-pro-v1:0');
      }
    }

    // Enterprise Cloud AI: OCI GenAI
    if (settings['oci_genai_compartment_id'] && settings['oci_genai_api_key']) {
      const ociM = settings['oci_genai_model'] || 'cohere.command-r-plus';
      cloudModels.push(`oci/${ociM}`);
    }

    return {
      ollamaOnline,
      localModels,
      cloudModels,
      defaultModel: settings['default_model'] || process.env.DEFAULT_MODEL || (localModels.length > 0 ? localModels[0] : (cloudModels.length > 0 ? cloudModels[0] : '')),
      defaultProvider: settings['default_provider'] || process.env.DEFAULT_PROVIDER || (localModels.length > 0 ? 'ollama' : (cloudModels.length > 0 ? 'cloud' : 'ollama')),
      hasKeys: {
        ...hasKeys,
        azure: Boolean(settings['azure_openai_endpoint'] && settings['azure_openai_api_key']),
        bedrock: Boolean(settings['aws_bedrock_access_key'] && settings['aws_bedrock_secret_key']),
        oci: Boolean(settings['oci_genai_compartment_id'] && settings['oci_genai_api_key'])
      }
    };
  });

  // 6b. Fetch Live Ollama Model Library & Catalog with RAM/hardware specifications
  fastify.get('/api/models/ollama/library', async (request, reply) => {
    try {
      const baseUrl = getOllamaBaseUrl();
      let installedTags: string[] = [];
      try {
        const tagsRes = await fetch(`${baseUrl}/api/tags`);
        if (tagsRes.ok) {
          const tagsData: any = await tagsRes.json();
          installedTags = (tagsData.models || []).map((m: any) => (m.name || m.model || '').toLowerCase());
        }
      } catch {
        // Ollama may be offline or starting
      }

      // Check if remote library is online
      let onlineLibraryModels: string[] = [];
      try {
        const onlineRes = await fetch('https://ollama.com/library', { signal: AbortSignal.timeout(3000) });
        if (onlineRes.ok) {
          const html = await onlineRes.text();
          const matches = [...html.matchAll(/href="\/library\/([a-zA-Z0-9_\-\.]+)"/g)].map((x) => x[1]);
          onlineLibraryModels = Array.from(new Set(matches));
        }
      } catch {
        // Fallback to static catalog if internet is unavailable or slow
      }

      const catalog = [
        {
          id: 'qwen2.5-coder',
          name: 'Qwen 2.5 Coder',
          category: 'coding',
          categoryLabel: '⭐ IaC & Coding Flagship',
          description: 'Specialized code intelligence by Alibaba Cloud. Outperforms larger models on Terraform HCL, multi-file modules, and Kubernetes manifests.',
          featured: true,
          tags: [
            { tag: 'qwen2.5-coder:1.5b', size: '~1.0 GB', minRam: '2 GB RAM', role: 'Ultra-fast & Lightweight for Dev Containers' },
            { tag: 'qwen2.5-coder:3b', size: '~2.0 GB', minRam: '4 GB RAM', role: '⭐ Best Overall for Pure CPU (Laptop)' },
            { tag: 'qwen2.5-coder:7b', size: '~4.5 GB', minRam: '8 GB RAM', role: '⭐ Flagship for Terraform & IaC' },
            { tag: 'qwen2.5-coder:14b', size: '~9.0 GB', minRam: '16 GB RAM', role: 'Enterprise Multi-Module Architecture' },
            { tag: 'qwen2.5-coder:32b', size: '~19.0 GB', minRam: '32 GB RAM', role: 'Production Scale Cloud Architect' }
          ]
        },
        {
          id: 'deepseek-r1',
          name: 'DeepSeek R1 (Distill)',
          category: 'reasoning',
          categoryLabel: '🧠 Chain-of-Thought Reasoning',
          description: 'First-class architectural reasoning model. Uses native thinking steps to plan complex multi-tier topologies, spot edge cases, and debug errors.',
          featured: true,
          tags: [
            { tag: 'deepseek-r1:1.5b', size: '~1.1 GB', minRam: '2 GB RAM', role: 'Fast CoT Reasoning on CPU' },
            { tag: 'deepseek-r1:7b', size: '~4.7 GB', minRam: '8 GB RAM', role: '⭐ Best for Architecture Logic & Debugging' },
            { tag: 'deepseek-r1:8b', size: '~4.9 GB', minRam: '8 GB RAM', role: 'DeepSeek Distill Llama 8B' },
            { tag: 'deepseek-r1:14b', size: '~9.0 GB', minRam: '16 GB RAM', role: 'Enterprise Infrastructure Design' }
          ]
        },
        {
          id: 'llama3.2',
          name: 'Meta Llama 3.2',
          category: 'lightweight',
          categoryLabel: '⚡ Ultra-Lightweight (CPU)',
          description: 'Ultra-efficient small language model from Meta. Ideal for resource-constrained edge machines, low-spec cloud VMs, and fast text generation.',
          featured: true,
          tags: [
            { tag: 'llama3.2:1b', size: '~1.3 GB', minRam: '2 GB RAM', role: 'Minimal Footprint Edge Model' },
            { tag: 'llama3.2:3b', size: '~2.0 GB', minRam: '4 GB RAM', role: 'Balanced CPU Generalist' }
          ]
        },
        {
          id: 'llama3.1',
          name: 'Meta Llama 3.1',
          category: 'general',
          categoryLabel: '🌐 General DevOps & Docs',
          description: 'Flagship general-purpose model by Meta with 128k context window. Excels at generating deployment documentation, runbooks, and SOPs.',
          featured: true,
          tags: [
            { tag: 'llama3.1:8b', size: '~4.7 GB', minRam: '8 GB RAM', role: '⭐ Flagship 8B Generalist' },
            { tag: 'llama3.1:70b', size: '~40.0 GB', minRam: '64 GB RAM', role: 'Full Enterprise Cloud Platform' }
          ]
        },
        {
          id: 'codellama',
          name: 'Code Llama',
          category: 'coding',
          categoryLabel: '💻 Code Generation',
          description: 'Code-specialized Llama from Meta. Trained on public codebases for scripting, Terraform provider declarations, and bash utilities.',
          featured: false,
          tags: [
            { tag: 'codellama:7b', size: '~3.8 GB', minRam: '8 GB RAM', role: 'Standard Code Infilling' },
            { tag: 'codellama:13b', size: '~7.4 GB', minRam: '16 GB RAM', role: 'Extended Syntax Depth' }
          ]
        },
        {
          id: 'mistral',
          name: 'Mistral 7B',
          category: 'general',
          categoryLabel: '⚡ High-Speed Generalist',
          description: 'High-throughput foundation model by Mistral AI. Fast generation speeds with solid technical English understanding.',
          featured: false,
          tags: [
            { tag: 'mistral:7b', size: '~4.1 GB', minRam: '8 GB RAM', role: 'High-Speed 7B Generalist' },
            { tag: 'mistral-nemo:12b', size: '~7.1 GB', minRam: '12 GB RAM', role: '128k Context Window (NVIDIA collab)' }
          ]
        },
        {
          id: 'phi4',
          name: 'Microsoft Phi-4',
          category: 'reasoning',
          categoryLabel: '🔬 Complex Logic & Math',
          description: 'State-of-the-art 14B model by Microsoft Research. Exceptional synthetic data pretraining providing high math, reasoning, and logic accuracy.',
          featured: false,
          tags: [
            { tag: 'phi4:14b', size: '~9.1 GB', minRam: '16 GB RAM', role: 'Microsoft Synthetic Reasoning 14B' }
          ]
        },
        {
          id: 'gemma2',
          name: 'Google Gemma 2',
          category: 'general',
          categoryLabel: '💎 Google Open Weights',
          description: 'Lightweight, state-of-the-art open models built from the same research and technology used to create Google Gemini.',
          featured: false,
          tags: [
            { tag: 'gemma2:2b', size: '~1.6 GB', minRam: '4 GB RAM', role: 'Compact Google Assistant' },
            { tag: 'gemma2:9b', size: '~5.5 GB', minRam: '10 GB RAM', role: 'High-Performance 9B' }
          ]
        },
        {
          id: 'starcoder2',
          name: 'StarCoder 2',
          category: 'coding',
          categoryLabel: '⌨️ Code Completion',
          description: 'Trained by BigCode across 600+ programming languages with transparent open data licensing.',
          featured: false,
          tags: [
            { tag: 'starcoder2:3b', size: '~1.7 GB', minRam: '4 GB RAM', role: 'Lightweight Code Completion' },
            { tag: 'starcoder2:7b', size: '~4.3 GB', minRam: '8 GB RAM', role: 'Standard Code Scaffolding' }
          ]
        }
      ];

      // Mark installed tags
      const enrichedCatalog = catalog.map((model) => ({
        ...model,
        tags: model.tags.map((t) => {
          const isInstalled = installedTags.some(
            (inst) => inst === t.tag.toLowerCase() || inst === `${t.tag.toLowerCase()}:latest` || inst.startsWith(`${t.tag.toLowerCase()}:`)
          );
          return {
            ...t,
            installed: isInstalled
          };
        })
      }));

      return {
        online: onlineLibraryModels.length > 0,
        totalModels: enrichedCatalog.length,
        models: enrichedCatalog,
        onlineSlugs: onlineLibraryModels.slice(0, 25)
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch Ollama model library' });
    }
  });

  // 6c. Pull a new Ollama model with real-time SSE streaming progress
  fastify.post('/api/models/ollama/pull', async (request, reply) => {
    try {
      const { model } = (request.body as any) || {};
      if (!model || !String(model).trim()) {
        return reply.status(400).send({ error: 'Model name is required' });
      }
      const modelName = String(model).trim();
      
      reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');

      const sendEvent = (data: any) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      sendEvent({ status: `Connecting to Ollama library for '${modelName}'...`, percent: 0 });

      const controller = new AbortController();
      // Allow up to 30 minutes for large downloads
      const timeout = setTimeout(() => controller.abort(), 1800000);
      
      const baseUrl = getOllamaBaseUrl();
      const res = await fetch(`${baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errorText = await res.text();
        sendEvent({ error: errorText || `Ollama returned error (${res.status})` });
        reply.raw.write('data: [DONE]\n\n');
        reply.raw.end();
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.error) {
                const isStreamDrop = parsed.error.includes('stream reading error') || parsed.error.includes('wsarecv') || parsed.error.includes('forcibly closed');
                const cleanError = isStreamDrop
                  ? 'Registry connection temporarily dropped during download. Click Download again to resume from the cached chunks.'
                  : parsed.error;
                sendEvent({ error: cleanError });
                continue;
              }
              let percent = 0;
              if (parsed.total && parsed.completed) {
                percent = Math.min(100, Math.round((parsed.completed / parsed.total) * 100));
              }
              sendEvent({
                status: parsed.status || 'Downloading...',
                total: parsed.total || 0,
                completed: parsed.completed || 0,
                percent,
                digest: parsed.digest || ''
              });
            } catch {}
          }
        }
      }

      sendEvent({ status: `Successfully downloaded '${modelName}'!`, percent: 100, success: true });
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (err: any) {
      fastify.log.error(err);
      reply.raw.write(`data: ${JSON.stringify({ error: err.message || 'Error pulling Ollama model' })}\n\n`);
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    }
  });

  // 6c. Delete an existing Ollama model
  fastify.delete('/api/models/ollama/:model', async (request, reply) => {
    try {
      const { model } = request.params as { model: string };
      if (!model) {
        return reply.status(400).send({ error: 'Model name is required' });
      }
      const decoded = decodeURIComponent(model).trim();
      const baseUrl = getOllamaBaseUrl();
      const res = await fetch(`${baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: decoded })
      });

      if (res.ok) {
        return { success: true, message: `Model ${decoded} removed successfully` };
      } else {
        const errorText = await res.text();
        return reply.status(res.status).send({ error: errorText || 'Failed to delete model from Ollama' });
      }
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Error deleting Ollama model' });
    }
  });

  // 7. SSE Streaming Chat Endpoint
  fastify.post('/api/chat', async (request, reply) => {
    reply.hijack();

    try {
      const userId =
        (request.headers['x-user-id'] as string) ||
        (request.body as any)?.userId ||
        '';

      const reqBody = (request.body as any) || {};
      const {
        conversationId: incomingConvoId,
        projectId = '',
        messages: rawMessages,
        message: singleMessage,
        provider = 'ollama',
        model = '',
        agentId = 'agent_tf-devops-expert'
      } = reqBody;

      // Establish SSE stream
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

    // Defensively normalize messages array
    const messages: Array<{ role: string; content: string }> = Array.isArray(rawMessages)
      ? rawMessages
      : singleMessage
      ? [{ role: 'user', content: String(singleMessage) }]
      : [];

    // Ensure conversation exists
    let conversationId = incomingConvoId;
    const latestUserMsg = messages[messages.length - 1];
    const rawContent = latestUserMsg?.content?.trim() || 'Terraform Project';
    const cleanTitle = rawContent.split('\n')[0].replace(/[`#*]/g, '').trim().slice(0, 40) || 'Terraform Chat';

    if (!conversationId) {
      conversationId = randomUUID();
      createConversation(conversationId, cleanTitle, provider, model, projectId, userId, agentId);
    } else {
      const existing = getConversation(conversationId);
      if (!existing && latestUserMsg) {
        createConversation(conversationId, cleanTitle, provider, model, projectId, userId, agentId);
      } else if (existing && agentId) {
        updateConversationAgent(conversationId, agentId);
      }
    }

    // Save user message to database
    if (latestUserMsg && latestUserMsg.role === 'user') {
      addMessage(randomUUID(), conversationId, 'user', latestUserMsg.content, userId);
    }

    const assistantMessageId = randomUUID();
    let fullAssistantResponse = '';
    let tokenCounter = 0;

    const flushAssistantMessage = () => {
      if (!fullAssistantResponse.trim()) return;
      try {
        upsertMessage(assistantMessageId, conversationId, 'assistant', fullAssistantResponse, userId);
      } catch (dbErr) {
        fastify.log.warn({ err: dbErr }, 'Failed to persist assistant message to database');
      }
    };

    // Guarantee persistence if user stops generation, aborts, or closes connection
    request.raw.on('close', () => {
      flushAssistantMessage();
    });

    const streamToken = (token: string) => {
      fullAssistantResponse += token;
      reply.raw.write(`data: ${JSON.stringify({ content: token, conversationId })}\n\n`);

      // Incremental persistence every 15 tokens so partial answers are saved in chat history
      tokenCounter++;
      if (tokenCounter % 15 === 0) {
        flushAssistantMessage();
      }
    };

    const sendStatus = (status: string, phase = 'processing') => {
      reply.raw.write(`data: ${JSON.stringify({ status, phase, conversationId })}\n\n`);
    };

    sendStatus('Initializing conversation & agent context...', 'init');

    sendStatus('Loading local workspace context & files...', 'context');
    let projectContext: any = undefined;
    try {
      const files = await listWorkspaceFiles();
      if (projectId) {
        const proj = getProjectById(projectId);
        projectContext = {
          name: proj?.name || 'Project Workspace',
          description: proj?.description || '',
          workspacePath: WORKSPACE_PATH,
          files: files.map((f) => ({ name: f.name, size: f.size, content: f.content }))
        };
      } else {
        projectContext = {
          name: 'Global Workspace',
          description: 'Unified root workspace (direct access without segregation)',
          workspacePath: WORKSPACE_PATH,
          files: files.map((f) => ({ name: f.name, size: f.size, content: f.content }))
        };
      }
    } catch (e) {
      fastify.log.warn({ err: e }, 'Could not load workspace files for agent context');
    }

    const settings = getAllSettings();
    const systemPrompt = buildSystemPrompt(agentId, projectContext);

    const geminiKey = settings['gemini_api_key'] || process.env.GEMINI_API_KEY;
    const openaiKey = settings['openai_api_key'] || process.env.OPENAI_API_KEY;
    const anthropicKey = settings['anthropic_api_key'] || process.env.ANTHROPIC_API_KEY;
    const hasAnyCloudKey = Boolean(geminiKey || openaiKey || anthropicKey);

    let activeProvider = provider;

    // CASE 1: Local Ollama
    if (activeProvider === 'ollama') {
      const baseUrl = getOllamaBaseUrl();
      sendStatus(`Connecting to Ollama daemon (${baseUrl})...`, 'connecting');
      let ollamaActive = await isOllamaRunning();

      const autoStartPref = getSetting('ollama_auto_start') !== 'false';
      let startDaemonResult: any = null;
      if (!ollamaActive && autoStartPref) {
        sendStatus('⚙️ Ollama is offline. Auto-launching local Ollama server on 0.0.0.0:11434...', 'starting');
        try {
          startDaemonResult = await startOllamaDaemon();
          ollamaActive = await isOllamaRunning();
          if (ollamaActive) {
            sendStatus('✓ Local Ollama daemon started and listening on 0.0.0.0:11434!', 'ready');
          }
        } catch {}
      }

      if (!ollamaActive) {
        if (startDaemonResult?.isMuslError) {
          streamToken(
            `> ⚠️ **Alpine Linux / musl libc Incompatibility Detected**\n\n` +
              `The native Ollama binary requires GNU libc (\`glibc\`), which is not provided by Alpine Linux's musl libc (\`fcntl64: symbol not found\`).\n\n` +
              `### 🐳 Recommended Solutions:\n` +
              `1. **Run Ollama via Docker (Runs anywhere):**\n` +
              `   \`\`\`bash\n   docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama\n   \`\`\`\n\n` +
              `2. **Connect to Host Machine's Ollama:**\n` +
              `   If TerraMind is running in Docker or WSL, open **Settings → Local Models** and set **Ollama Host URL** to:\n` +
              `   \`http://host.docker.internal:11434\`\n\n` +
              `3. **Switch to Cloud AI:**\n` +
              `   Select **Google Gemini**, **OpenAI**, or **Claude** in the model dropdown above for zero-dependency cloud reasoning.`
          );
        } else {
          streamToken(
            `> ⚠️ **Ollama server is offline or unreachable at \`${baseUrl}\`.**\n\n` +
              `TerraMind attempted to connect to your Ollama daemon, but the service is not currently responding.\n\n` +
              `### 🌐 Port Forwarding & Remote Setup:\n` +
              `If you are running in **Docker**, **WSL2**, **remote Linux**, or a **cloud VM**, ensure Ollama is listening on all interfaces with CORS enabled by running:\n\n` +
              `\`\`\`bash\nexport OLLAMA_HOST="0.0.0.0:11434"\nexport OLLAMA_ORIGINS="*"\nollama serve\n\`\`\`\n\n` +
              `### ⚡ Quick Fix Options:\n` +
              `1. Open **Settings → Local Models (Ollama)** and click **"Start Service"** or **"Install Ollama"**.\n` +
              `2. If your Ollama server is running on a different port or IP, configure the **Ollama Host URL** in Settings.\n` +
              `3. Or select **Cloud AI** (Gemini, Claude, OpenAI) in the model menu above to continue immediately.`
          );
        }
        reply.raw.write(`data: [DONE]\n\n`);
        reply.raw.end();
        return;
      }

      // Automatically resolve target model to match installed local models
      let targetModel = model;
      sendStatus('Verifying local model availability...', 'resolving');
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const tagsRes = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal });
        clearTimeout(timeout);
        if (tagsRes.ok) {
          const tagsData = (await tagsRes.json()) as any;
          const available = (tagsData.models || []).map((m: any) => m.name);
          if (available.length > 0) {
            if (!targetModel || !available.includes(targetModel)) {
              targetModel = available[0];
            }
          }
        }
      } catch (e) {
        fastify.log.warn({ err: e }, 'Could not query Ollama tags for model fallback');
      }

      if (!targetModel) {
        targetModel = 'qwen2.5-coder:1.5b';
      }

      sendStatus(`Processing prompt with '${targetModel}'...`, 'generating');

      try {
        const ollamaRes = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: targetModel,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            options: {
              num_ctx: 16384,
              num_predict: 4096,
              temperature: 0.2,
              repeat_penalty: 1.18,
              repeat_last_n: 128,
              top_p: 0.9,
              top_k: 40
            },
            stream: true
          })
        });

        if (!ollamaRes.ok) {
          const errText = await ollamaRes.text();
          streamToken(
            `> ⚠️ **Ollama Error (${ollamaRes.status}):**\n\n${errText}\n\nMake sure model \`${targetModel}\` is downloaded via \`ollama pull ${targetModel}\`.`
          );
        } else if (ollamaRes.body) {
          const reader = ollamaRes.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  streamToken(data.message.content);
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        streamToken(`> ⚠️ **Failed to stream from Ollama:** ${err.message}`);
      }
    }

    // CASE 2: Cloud AI Providers (Gemini, OpenAI, Anthropic)
    if (activeProvider === 'cloud') {
      // Intelligently select target model matching available keys
      let targetModel = model;

      const hasAzure = Boolean(settings['azure_openai_endpoint'] && settings['azure_openai_api_key']);
      const hasBedrock = Boolean(settings['aws_bedrock_access_key'] && settings['aws_bedrock_secret_key']);
      const hasOci = Boolean(settings['oci_genai_compartment_id'] && settings['oci_genai_api_key']);

      if (
        !targetModel ||
        (targetModel.startsWith('gemini') && !geminiKey) ||
        (targetModel.startsWith('gpt') && !openaiKey) ||
        (targetModel.startsWith('claude') && !anthropicKey) ||
        (targetModel.startsWith('azure') && !hasAzure) ||
        (targetModel.startsWith('bedrock') && !hasBedrock) ||
        (targetModel.startsWith('oci') && !hasOci)
      ) {
        if (geminiKey) targetModel = 'gemini-2.5-flash';
        else if (openaiKey) targetModel = 'gpt-4o';
        else if (anthropicKey) targetModel = 'claude-3-5-sonnet-20241022';
        else if (hasAzure) targetModel = `azure/${settings['azure_openai_deployment'] || 'gpt-4o'}`;
        else if (hasBedrock) targetModel = `bedrock/${settings['aws_bedrock_model'] || 'anthropic.claude-3-5-sonnet-20241022-v2:0'}`;
        else if (hasOci) targetModel = `oci/${settings['oci_genai_model'] || 'cohere.command-r-plus'}`;
        else targetModel = 'gemini-2.5-flash';
      }

      // If user had an obsolete or non-existent Gemini tag, normalize to verified stable model
      if (targetModel.startsWith('gemini') && (targetModel === 'gemini-3.6-flash' || targetModel === 'gemini-3-flash-preview')) {
        targetModel = 'gemini-2.5-flash';
      }

      const isGemini = targetModel.startsWith('gemini');
      const isAnthropic = targetModel.startsWith('claude');
      const isOpenAI = targetModel.startsWith('gpt') || targetModel.startsWith('o1') || targetModel.startsWith('o3');
      const isAzure = targetModel.startsWith('azure/') || targetModel.startsWith('azure-');
      const isBedrock = targetModel.startsWith('bedrock/') || targetModel.startsWith('bedrock-');
      const isOci = targetModel.startsWith('oci/') || targetModel.startsWith('oci-');

      if (isGemini && !geminiKey) {
        streamToken(
          `> 🔑 **Gemini API Key Missing**\n\nPlease add your Google Gemini API key in **Settings > API Keys** (gear icon in sidebar or composer) to enable cloud generation with \`${targetModel}\`.`
        );
      } else if (isOpenAI && !openaiKey) {
        streamToken(
          `> 🔑 **OpenAI API Key Missing**\n\nPlease add your OpenAI API key in **Settings > API Keys** (gear icon in sidebar or composer) to enable cloud generation with \`${targetModel}\`.`
        );
      } else if (isAnthropic && !anthropicKey) {
        streamToken(
          `> 🔑 **Anthropic API Key Missing**\n\nPlease add your Anthropic API key in **Settings > API Keys** (gear icon in sidebar or composer) to enable cloud generation with \`${targetModel}\`.`
        );
      } else if (isGemini && geminiKey) {
        sendStatus(`Connecting to Google Gemini (${targetModel})...`, 'connecting');
        const geminiFallbacks = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        if (!geminiFallbacks.includes(targetModel) && targetModel.startsWith('gemini')) {
          geminiFallbacks.unshift(targetModel);
        }

        // Stream Gemini Generate Content with automatic fallback for 503 / 429 / 404 / 500
        const streamGemini = async (modelToUse: string, triedModels: string[] = []): Promise<boolean> => {
          triedModels.push(modelToUse);
          try {
            sendStatus(`Generating response with Google Gemini (${modelToUse})...`, 'generating');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:streamGenerateContent?alt=sse&key=${geminiKey}`;

            // Sanitize messages: exclude prior error notices to prevent invalid prompt format
            const sanitizedMessages = messages.filter(
              (m) => m && m.content && !m.content.startsWith('> ⚠️') && !m.content.startsWith('> 🔑')
            );
            const validMessages = sanitizedMessages.length > 0 ? sanitizedMessages : messages;

            const contents = validMessages.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content || ' ' }]
            }));

            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents
              })
            });

            if (!res.ok) {
              const err = await res.text();
              const nextModel = geminiFallbacks.find((m) => !triedModels.includes(m));
              if (nextModel && (res.status === 503 || res.status === 429 || res.status === 404 || res.status === 500)) {
                streamToken(
                  `> ℹ️ *Model \`${modelToUse}\` is temporarily unavailable (${res.status}). Automatically switching to \`${nextModel}\`...*\n\n`
                );
                return await streamGemini(nextModel, triedModels);
              }
              streamToken(`> ⚠️ **Gemini Error (${res.status}):** ${err}`);
              return false;
            }

            if (res.body) {
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let hasEmitted = false;
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
                for (const line of lines) {
                  const raw = line.replace('data: ', '').trim();
                  try {
                    const data = JSON.parse(raw);
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      streamToken(text);
                      hasEmitted = true;
                    }
                  } catch {}
                }
              }
              return hasEmitted;
            }
            return false;
          } catch (e: any) {
            const nextModel = geminiFallbacks.find((m) => !triedModels.includes(m));
            if (nextModel) {
              streamToken(
                `> ℹ️ *Connection to \`${modelToUse}\` failed (${e.message}). Automatically retrying with \`${nextModel}\`...*\n\n`
              );
              return await streamGemini(nextModel, triedModels);
            }
            streamToken(`> ⚠️ **Gemini request failed:** ${e.message}`);
            return false;
          }
        };

        await streamGemini(targetModel);
      } else if (isOpenAI && openaiKey) {
        sendStatus(`Generating response with OpenAI (${targetModel})...`, 'generating');
        // Stream OpenAI Chat Completion
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: targetModel,
              messages: [{ role: 'system', content: systemPrompt }, ...messages],
              stream: true
            })
          });

          if (!res.ok) {
            const err = await res.text();
            let errMsg = err;
            try {
              const parsed = JSON.parse(err);
              if (parsed.error?.message) errMsg = parsed.error.message;
            } catch {}
            streamToken(`> ⚠️ **OpenAI Error (${res.status}):**\n\n${errMsg}\n\nPlease check or update your OpenAI API key in **Settings > API Keys**.`);
          } else if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let chunkBuffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunkBuffer += decoder.decode(value, { stream: true });
              const lines = chunkBuffer.split('\n');
              chunkBuffer = lines.pop() || '';
              for (const line of lines) {
                const raw = line.replace('data: ', '').trim();
                if (raw === '[DONE]') break;
                try {
                  const data = JSON.parse(raw);
                  const token = data.choices?.[0]?.delta?.content;
                  if (token) streamToken(token);
                } catch {}
              }
            }
          }
        } catch (e: any) {
          streamToken(`> ⚠️ **OpenAI request failed:** ${e.message}`);
        }
      } else if (isAnthropic && anthropicKey) {
        sendStatus(`Generating response with Anthropic (${targetModel})...`, 'generating');
        // Stream Anthropic Messages
        try {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: targetModel,
              system: systemPrompt,
              messages: messages.map((m) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              })),
              max_tokens: 4096,
              stream: true
            })
          });

          if (!res.ok) {
            const err = await res.text();
            let errMsg = err;
            try {
              const parsed = JSON.parse(err);
              if (parsed.error?.message) errMsg = parsed.error.message;
            } catch {}
            streamToken(`> ⚠️ **Anthropic Error (${res.status}):**\n\n${errMsg}\n\nPlease check or update your Anthropic API key in **Settings > API Keys**.`);
          } else if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let chunkBuffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunkBuffer += decoder.decode(value, { stream: true });
              const lines = chunkBuffer.split('\n');
              chunkBuffer = lines.pop() || '';
              for (const line of lines) {
                const raw = line.replace('data: ', '').trim();
                try {
                  const data = JSON.parse(raw);
                  if (data.type === 'content_block_delta' && data.delta?.text) {
                    streamToken(data.delta.text);
                  }
                } catch {}
              }
            }
          }
        } catch (e: any) {
          streamToken(`> ⚠️ **Anthropic request failed:** ${e.message}`);
        }
      } else if (isAzure) {
        sendStatus(`Connecting to Azure AI Foundry (${targetModel})...`, 'connecting');
        const endpoint = settings['azure_openai_endpoint'] || process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = settings['azure_openai_api_key'] || process.env.AZURE_OPENAI_API_KEY;
        const deploymentName = targetModel.replace(/^azure\//, '').replace(/^azure-/, '') || settings['azure_openai_deployment'] || 'gpt-4o';
        const apiVersion = settings['azure_openai_api_version'] || '2024-06-01';

        if (!endpoint || !apiKey) {
          streamToken(
            `> 🔑 **Azure AI Foundry Configuration Missing**\n\nPlease configure your Azure Endpoint and API Key in **Settings > Enterprise Cloud**.`
          );
        } else {
          try {
            await streamAzureFoundry({
              endpoint,
              apiKey,
              deploymentName,
              apiVersion,
              systemPrompt,
              messages,
              onToken: streamToken
            });
          } catch (e: any) {
            streamToken(`> ⚠️ **Azure AI Foundry error:** ${e.message}`);
          }
        }
      } else if (isBedrock) {
        sendStatus(`Connecting to AWS Bedrock (${targetModel})...`, 'connecting');
        const region = settings['aws_bedrock_region'] || process.env.AWS_REGION || 'us-east-1';
        const accessKeyId = settings['aws_bedrock_access_key'] || process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = settings['aws_bedrock_secret_key'] || process.env.AWS_SECRET_ACCESS_KEY;
        const sessionToken = settings['aws_bedrock_session_token'] || process.env.AWS_SESSION_TOKEN;
        const modelId = targetModel.replace(/^bedrock\//, '').replace(/^bedrock-/, '') || settings['aws_bedrock_model'] || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

        if (!accessKeyId || !secretAccessKey) {
          streamToken(
            `> 🔑 **AWS Bedrock Credentials Missing**\n\nPlease configure your AWS Access Key, Secret Key, and Region in **Settings > Enterprise Cloud**.`
          );
        } else {
          try {
            await invokeBedrockConverse({
              region,
              accessKeyId,
              secretAccessKey,
              sessionToken,
              modelId,
              systemPrompt,
              messages,
              onToken: streamToken
            });
          } catch (e: any) {
            streamToken(`> ⚠️ **AWS Bedrock error:** ${e.message}`);
          }
        }
      } else if (isOci) {
        sendStatus(`Connecting to OCI Generative AI (${targetModel})...`, 'connecting');
        const region = settings['oci_genai_region'] || 'us-chicago-1';
        const compartmentId = settings['oci_genai_compartment_id'] || process.env.OCI_COMPARTMENT_ID;
        const apiKey = settings['oci_genai_api_key'] || process.env.OCI_GENAI_API_KEY;
        const modelId = targetModel.replace(/^oci\//, '').replace(/^oci-/, '') || settings['oci_genai_model'] || 'cohere.command-r-plus';

        if (!compartmentId || !apiKey) {
          streamToken(
            `> 🔑 **OCI GenAI Credentials Missing**\n\nPlease configure your OCI Compartment ID and Auth Key in **Settings > Enterprise Cloud**.`
          );
        } else {
          try {
            await invokeOciGenAi({
              region,
              compartmentId,
              apiKey,
              modelId,
              systemPrompt,
              messages,
              onToken: streamToken
            });
          } catch (e: any) {
            streamToken(`> ⚠️ **OCI Generative AI error:** ${e.message}`);
          }
        }
      }
    }

      // Automated Local Workspace Execution & Validation:
      // Scan fullAssistantResponse for code blocks containing files to automatically write to disk and validate
      const codeBlockRegex = /```(?:hcl|terraform|yaml|yml|json|bash|sh|markdown)?\s*\n([\s\S]*?)```/g;
      let match;
      const extractedFiles: Array<{ filename: string; content: string }> = [];

      while ((match = codeBlockRegex.exec(fullAssistantResponse)) !== null) {
        const blockCode = match[1];
        if (!blockCode || !blockCode.trim()) continue;

        // Check if a smaller model lumped multiple files into a single code block
        const fileHeaderRegex = /^(?:#|\/\/|\/\*|<!--)\s*([a-zA-Z0-9_\-\.\/]+\.(?:tf|yaml|yml|json|hcl|sh))(?:\s*\(.*?\))?\s*$/i;
        const blockLines = blockCode.split('\n');
        const splitIndices: Array<{ lineIndex: number; filename: string }> = [];

        for (let j = 0; j < blockLines.length; j++) {
          const trimmed = blockLines[j].trim();
          const matchHeader = trimmed.match(fileHeaderRegex);
          if (matchHeader) {
            splitIndices.push({ lineIndex: j, filename: matchHeader[1].trim() });
          }
        }

        if (splitIndices.length > 1) {
          // Multiple files detected inside one single code block! Split each into its own file
          for (let s = 0; s < splitIndices.length; s++) {
            const startLine = splitIndices[s].lineIndex;
            const endLine = s + 1 < splitIndices.length ? splitIndices[s + 1].lineIndex : blockLines.length;
            const chunk = blockLines.slice(startLine, endLine).join('\n').trim();
            const fName = splitIndices[s].filename;
            if (chunk && !extractedFiles.some((f) => f.filename === fName)) {
              extractedFiles.push({ filename: fName, content: chunk });
            }
          }
          continue;
        }

        const firstLine = blockCode.trim().split('\n')[0].trim();
        // Look for filename in comments: # path/file.tf, // path/file.tf, <!-- file -->
        const fileMatch = firstLine.match(/^(?:#|\/\/|\/\*|<!--)\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)/);
        let detectedFilename = fileMatch ? fileMatch[1].trim() : '';

        if (!detectedFilename) {
          // Heuristic detection based on content
          if (blockCode.includes('required_providers') || (blockCode.includes('terraform {') && blockCode.includes('required_version'))) {
            detectedFilename = 'providers.tf';
          } else if (blockCode.includes('variable "') && !blockCode.includes('resource "')) {
            detectedFilename = 'variables.tf';
          } else if (blockCode.includes('output "') && !blockCode.includes('resource "')) {
            detectedFilename = 'outputs.tf';
          } else if (blockCode.includes('resource "') || blockCode.includes('module "')) {
            detectedFilename = 'main.tf';
          } else if (blockCode.includes('apiVersion:') && blockCode.includes('kind:')) {
            detectedFilename = 'k8s/deployment.yaml';
          } else if (blockCode.includes('name:') && (blockCode.includes('on: [push') || blockCode.includes('on:\n  push:'))) {
            detectedFilename = '.github/workflows/deploy.yml';
          }
        }

        if (detectedFilename) {
          // Avoid duplicate writes of the same filename in one turn
          if (!extractedFiles.some((f) => f.filename === detectedFilename)) {
            extractedFiles.push({ filename: detectedFilename, content: blockCode });
          }
        }
      }

      if (extractedFiles.length > 0) {
        sendStatus(`Writing ${extractedFiles.length} file(s) to local workspace & validating...`, 'compiling');
        const validationReports: string[] = [];

        for (const file of extractedFiles) {
          try {
            const writeRes = await writeWorkspaceFile(file.filename, file.content);
            let report = `- 📄 **\`${writeRes.relPath}\`**: Auto-saved to workspace.`;
            if (writeRes.fmtOutput) {
              report += `\n  - \`terraform fmt\`: ${writeRes.fmtOutput}`;
            }
            if (writeRes.validateOutput) {
              report += `\n  - \`terraform validate\`: ${writeRes.validateOutput}`;
            }
            validationReports.push(report);
          } catch (writeErr: any) {
            validationReports.push(`- ⚠️ **\`${file.filename}\`**: Save/validation error: ${writeErr.message}`);
          }
        }

        const autoSummary = `\n\n---\n### 🛠️ Automated Local Validation & Workspace Sync\n${validationReports.join('\n\n')}\n`;
        streamToken(autoSummary);
        sendStatus('Workspace files updated & validated successfully.', 'done');
      }

      // Final flush of assistant message to SQLite & MongoDB
      flushAssistantMessage();

      reply.raw.write(`data: [DONE]\n\n`);
      reply.raw.end();
    } catch (err: any) {
      fastify.log.error({ err }, 'Error in /api/chat stream handler');
      // Guarantee whatever content was streamed so far is preserved in history
      flushAssistantMessage();
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
        reply.raw.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
      } else {
        try {
          reply.raw.write(`data: ${JSON.stringify({ content: `\n\n> ⚠️ **Error:** ${err.message}` })}\n\n`);
          reply.raw.write(`data: [DONE]\n\n`);
          reply.raw.end();
        } catch {}
      }
    } finally {
      flushAssistantMessage();
    }
  });
}
