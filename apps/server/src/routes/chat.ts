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
  createProject,
  deleteProject
} from '../db';
import { buildSystemPrompt } from './agent-prompts';

interface ChatRequestBody {
  conversationId?: string;
  projectId?: string;
  messages: Array<{ role: string; content: string }>;
  provider?: string;
  model?: string;
  agentId?: string;
}

export default async function chatRoutes(fastify: FastifyInstance) {
  // 1. Projects API
  fastify.get('/api/projects', async (request, reply) => {
    try {
      const projects = getProjects();
      return { projects };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch projects' });
    }
  });

  fastify.post('/api/projects', async (request, reply) => {
    try {
      const { name, description, icon } = request.body as any;
      if (!name) {
        return reply.status(400).send({ error: 'Project name is required' });
      }
      const id = 'proj-' + Date.now();
      const proj = createProject(id, name, description || '', icon || '📁');
      return proj;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to create project' });
    }
  });

  fastify.delete('/api/projects/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      deleteProject(id);
      return { success: true };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to delete project' });
    }
  });

  // 2. List conversations (optionally filtered by projectId)
  fastify.get('/api/conversations', async (request, reply) => {
    try {
      const { projectId } = request.query as { projectId?: string };
      const convos = getConversations(projectId);
      return { conversations: convos };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch conversations' });
    }
  });

  // 3. Create conversation
  fastify.post('/api/conversations', async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      const id = body.id || randomUUID();
      const title = body.title || 'New Infrastructure Chat';
      const provider = body.provider || 'ollama';
      const model = body.model || '';
      const projectId = body.projectId || 'proj-aws';
      const convo = createConversation(id, title, provider, model, projectId);
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
      const { id } = request.params as { id: string };
      deleteConversation(id);
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

    const cloudModels = [
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet-20241022'
    ];

    const settings = getAllSettings();
    const hasKeys = {
      gemini: Boolean(settings['gemini_api_key'] || process.env.GEMINI_API_KEY),
      openai: Boolean(settings['openai_api_key'] || process.env.OPENAI_API_KEY),
      anthropic: Boolean(settings['anthropic_api_key'] || process.env.ANTHROPIC_API_KEY)
    };

    return {
      ollamaOnline,
      localModels,
      cloudModels,
      hasKeys
    };
  });

  // 7. SSE Streaming Chat Endpoint
  fastify.post('/api/chat', async (request, reply) => {
    const {
      conversationId: incomingConvoId,
      projectId = 'proj-aws',
      messages,
      provider = 'ollama',
      model = '',
      agentId = 'agent_tf-devops-expert'
    } = request.body as ChatRequestBody;

    // Establish SSE stream
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    // Ensure conversation exists
    let conversationId = incomingConvoId;
    const latestUserMsg = messages[messages.length - 1];

    if (!conversationId) {
      conversationId = randomUUID();
      const titlePrompt = latestUserMsg?.content?.slice(0, 32) || 'Terraform Project';
      createConversation(conversationId, titlePrompt, provider, model, projectId);
    } else {
      const existing = getConversation(conversationId);
      if (!existing && latestUserMsg) {
        const titlePrompt = latestUserMsg?.content?.slice(0, 32) || 'Terraform Project';
        createConversation(conversationId, titlePrompt, provider, model, projectId);
      }
    }

    // Save user message to database
    if (latestUserMsg && latestUserMsg.role === 'user') {
      addMessage(randomUUID(), conversationId, 'user', latestUserMsg.content);
    }

    let fullAssistantResponse = '';

    const streamToken = (token: string) => {
      fullAssistantResponse += token;
      reply.raw.write(`data: ${JSON.stringify({ content: token, conversationId })}\n\n`);
    };

    const settings = getAllSettings();
    const systemPrompt = buildSystemPrompt(agentId);

    // CASE 1: Local Ollama
    if (provider === 'ollama') {
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
        streamToken(
          `> ⚠️ **Ollama is offline or unreachable on port 11434.**\n\n` +
            `TerraMind could not connect to your local Ollama daemon. Please start it using:\n\n` +
            `\`\`\`bash\nollama serve\n\`\`\`\n\n` +
            `Or switch to **Cloud AI** under the prompt box if you have configured an API key.`
        );
        reply.raw.write(`data: [DONE]\n\n`);
        reply.raw.end();
        return;
      }

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
    else if (provider === 'cloud') {
      const targetModel = model || 'gemini-2.5-flash';
      const geminiKey = settings['gemini_api_key'] || process.env.GEMINI_API_KEY;
      const openaiKey = settings['openai_api_key'] || process.env.OPENAI_API_KEY;
      const anthropicKey = settings['anthropic_api_key'] || process.env.ANTHROPIC_API_KEY;

      const isGemini = targetModel.startsWith('gemini');
      const isAnthropic = targetModel.startsWith('claude');
      const isOpenAI = targetModel.startsWith('gpt');

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
            streamToken(`> ⚠️ **OpenAI Error (${res.status}):** ${err}`);
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
            streamToken(`> ⚠️ **Anthropic Error (${res.status}):** ${err}`);
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

    // Save assistant message to SQLite
    if (fullAssistantResponse.trim()) {
      addMessage(randomUUID(), conversationId, 'assistant', fullAssistantResponse);
    }

    reply.raw.write(`data: [DONE]\n\n`);
    reply.raw.end();
  });
}
