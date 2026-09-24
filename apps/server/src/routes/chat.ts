import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import {
  createConversation,
  getConversations,
  getConversation,
  getMessages,
  addMessage,
  deleteConversation,
  updateConversationTitle,
  getAllSettings,
  getProjects,
  getProjectById,
  createProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from '../db';
import { buildSystemPrompt } from './agent-prompts';
import { listWorkspaceFiles } from '../services/terraform';

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
      const convo = createConversation(id, title, provider, model, projectId, userId);
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

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = (await res.json()) as any;
        ollamaOnline = true;
        localModels = (data.models || []).map((m: any) => m.name);
      }
    } catch {
      ollamaOnline = false;
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

            // Sort prioritizing latest flash, pro, and stable versions
            fetched.sort((a: string, b: string) => {
              const score = (name: string) => {
                if (name === 'gemini-2.5-flash') return 100;
                if (name === 'gemini-2.5-pro') return 95;
                if (name === 'gemini-2.0-flash') return 90;
                if (name === 'gemini-flash-latest') return 88;
                if (name === 'gemini-1.5-pro') return 85;
                if (name === 'gemini-1.5-flash') return 80;
                if (name === 'gemini-2.5-flash-lite') return 75;
                if (name === 'gemini-flash-lite-latest') return 70;
                if (name.includes('2.5')) return 65;
                if (name.includes('2.0')) return 60;
                if (name.includes('1.5')) return 55;
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
        cloudModels.push('gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro');
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

    return {
      ollamaOnline,
      localModels,
      cloudModels,
      hasKeys
    };
  });

  // 6b. Pull a new Ollama model
  fastify.post('/api/models/ollama/pull', async (request, reply) => {
    try {
      const { model } = (request.body as any) || {};
      if (!model || !String(model).trim()) {
        return reply.status(400).send({ error: 'Model name is required' });
      }
      const modelName = String(model).trim();
      
      const controller = new AbortController();
      // Allow up to 10 minutes for large downloads
      const timeout = setTimeout(() => controller.abort(), 600000);
      
      const res = await fetch('http://127.0.0.1:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: false }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        return { success: true, message: `Model ${modelName} downloaded successfully` };
      } else {
        const errorText = await res.text();
        return reply.status(res.status).send({ error: errorText || 'Failed to pull model from Ollama' });
      }
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Error pulling Ollama model' });
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
      const res = await fetch('http://127.0.0.1:11434/api/delete', {
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
      createConversation(conversationId, cleanTitle, provider, model, projectId, userId);
    } else {
      const existing = getConversation(conversationId);
      if (!existing && latestUserMsg) {
        createConversation(conversationId, cleanTitle, provider, model, projectId, userId);
      }
    }

    // Save user message to database
    if (latestUserMsg && latestUserMsg.role === 'user') {
      addMessage(randomUUID(), conversationId, 'user', latestUserMsg.content, userId);
    }

    let fullAssistantResponse = '';

    const streamToken = (token: string) => {
      fullAssistantResponse += token;
      reply.raw.write(`data: ${JSON.stringify({ content: token, conversationId })}\n\n`);
    };

    let projectContext: any = undefined;
    if (projectId) {
      try {
        const proj = getProjectById(projectId);
        const files = await listWorkspaceFiles();
        if (proj) {
          projectContext = {
            name: proj.name,
            description: proj.description,
            files: files.map((f) => ({ name: f.name, size: f.size, content: f.content }))
          };
        }
      } catch (e) {
        fastify.log.warn({ err: e }, 'Could not load project workspace files for agent context');
      }
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
      let ollamaActive = false;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const check = await fetch('http://127.0.0.1:11434/api/version', { signal: controller.signal });
        clearTimeout(timeout);
        ollamaActive = check.ok;
      } catch {
        ollamaActive = false;
      }

      if (!ollamaActive) {
        if (hasAnyCloudKey) {
          // Auto-fallback to configured cloud AI if Ollama is offline
          activeProvider = 'cloud';
        } else {
          streamToken(
            `> ⚠️ **Ollama is offline or unreachable on port 11434.**\n\n` +
              `TerraMind could not connect to your local Ollama daemon. Please start it using:\n\n` +
              `\`\`\`bash\nollama serve\n\`\`\`\n\n` +
              `Or add an API key in **Settings > API Keys** (gear icon) to use Cloud AI.`
          );
          reply.raw.write(`data: [DONE]\n\n`);
          reply.raw.end();
          return;
        }
      }
    }

    if (activeProvider === 'ollama') {
      const targetModel = model || 'qwen2.5-coder:7b';

      try {
        const ollamaRes = await fetch('http://127.0.0.1:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: targetModel,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
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
      if (
        !targetModel ||
        (targetModel.startsWith('gemini') && !geminiKey) ||
        (targetModel.startsWith('gpt') && !openaiKey) ||
        (targetModel.startsWith('claude') && !anthropicKey)
      ) {
        if (openaiKey) targetModel = 'gpt-4o';
        else if (geminiKey) targetModel = 'gemini-2.5-flash';
        else if (anthropicKey) targetModel = 'claude-3-5-sonnet-20241022';
        else targetModel = 'gpt-4o';
      }

      const isGemini = targetModel.startsWith('gemini');
      const isAnthropic = targetModel.startsWith('claude');
      const isOpenAI = targetModel.startsWith('gpt') || targetModel.startsWith('o1') || targetModel.startsWith('o3');

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
        // Stream Gemini Generate Content
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${geminiKey}`;
          const contents = messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
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
            streamToken(`> ⚠️ **Gemini Error (${res.status}):** ${err}`);
          } else if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
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
                  if (text) streamToken(text);
                } catch {}
              }
            }
          }
        } catch (e: any) {
          streamToken(`> ⚠️ **Gemini request failed:** ${e.message}`);
        }
      } else if (isOpenAI && openaiKey) {
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
      }
    }

    // Save assistant message to SQLite & MongoDB
    if (fullAssistantResponse.trim()) {
      addMessage(randomUUID(), conversationId, 'assistant', fullAssistantResponse, userId);
    }

    reply.raw.write(`data: [DONE]\n\n`);
    reply.raw.end();
  });
}
