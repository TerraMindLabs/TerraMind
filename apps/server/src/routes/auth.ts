import { FastifyInstance } from 'fastify';
import { randomUUID, createHash } from 'crypto';
import {
  getUserByUsername,
  createUser,
  getUserCount,
  getAllSettings,
  setSetting
} from '../db';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export default async function authAndSettingsRoutes(fastify: FastifyInstance) {
  // Check auth status
  fastify.get('/api/auth/status', async (request, reply) => {
    const totalUsers = getUserCount();
    return {
      requiresSetup: totalUsers === 0
    };
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body as any || {};
    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid username or password' });
    }

    if (user.password_hash !== hashPassword(password)) {
      return reply.status(401).send({ error: 'Invalid username or password' });
    }

    return {
      success: true,
      user: { id: user.id, username: user.username }
    };
  });

  // Register / Setup first user
  fastify.post('/api/auth/register', async (request, reply) => {
    const { username, password } = request.body as any || {};
    if (!username || !password || password.length < 4) {
      return reply.status(400).send({ error: 'Username and password (min 4 chars) are required' });
    }

    const existing = getUserByUsername(username);
    if (existing) {
      return reply.status(400).send({ error: 'Username already exists' });
    }

    const newUser = createUser(randomUUID(), username, hashPassword(password));
    return {
      success: true,
      user: newUser
    };
  });

  // Get Settings (API keys)
  fastify.get('/api/settings', async (request, reply) => {
    const settings = getAllSettings();
    return {
      openaiApiKey: settings['openai_api_key'] ? maskKey(settings['openai_api_key']) : '',
      geminiApiKey: settings['gemini_api_key'] ? maskKey(settings['gemini_api_key']) : '',
      anthropicApiKey: settings['anthropic_api_key'] ? maskKey(settings['anthropic_api_key']) : '',
      hasOpenaiKey: Boolean(settings['openai_api_key'] || process.env.OPENAI_API_KEY),
      hasGeminiKey: Boolean(settings['gemini_api_key'] || process.env.GEMINI_API_KEY),
      hasAnthropicKey: Boolean(settings['anthropic_api_key'] || process.env.ANTHROPIC_API_KEY)
    };
  });

  // Save Settings (API keys)
  fastify.post('/api/settings', async (request, reply) => {
    const body = request.body as any || {};
    if (body.openaiApiKey !== undefined && !body.openaiApiKey.includes('••••')) {
      setSetting('openai_api_key', body.openaiApiKey.trim());
    }
    if (body.geminiApiKey !== undefined && !body.geminiApiKey.includes('••••')) {
      setSetting('gemini_api_key', body.geminiApiKey.trim());
    }
    if (body.anthropicApiKey !== undefined && !body.anthropicApiKey.includes('••••')) {
      setSetting('anthropic_api_key', body.anthropicApiKey.trim());
    }
    return { success: true };
  });
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
