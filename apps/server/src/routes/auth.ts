import { FastifyInstance } from 'fastify';
import { randomUUID, createHash } from 'crypto';
import {
  getUserByUsername,
  createUser,
  getUserCount,
  getAllSettings,
  setSetting,
  recordUserSession,
  logUserActivity
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
    const { username, password } = (request.body as any) || {};
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

    const sessionToken = randomUUID();
    recordUserSession(user.id, user.username, sessionToken);
    logUserActivity(user.id, 'user_logged_in', { username: user.username });

    return {
      success: true,
      token: sessionToken,
      user: { id: user.id, username: user.username }
    };
  });

  // Register / Setup first user
  fastify.post('/api/auth/register', async (request, reply) => {
    const { username, password } = (request.body as any) || {};
    if (!username || !password || password.length < 4) {
      return reply.status(400).send({ error: 'Username and password (min 4 chars) are required' });
    }

    const existing = getUserByUsername(username);
    if (existing) {
      return reply.status(400).send({ error: 'Username already exists' });
    }

    const newUser = createUser(randomUUID(), username, hashPassword(password));
    const sessionToken = randomUUID();
    recordUserSession(newUser.id, newUser.username, sessionToken);

    return {
      success: true,
      token: sessionToken,
      user: newUser
    };
  });

  // SSO Login (Okta, Google, GitHub)
  fastify.post('/api/auth/sso', async (request, reply) => {
    try {
      const { provider = 'sso', email, name } = (request.body as any) || {};
      const username = email || (name ? `${name.toLowerCase().replace(/\s+/g, '_')}_${provider.toLowerCase()}` : `${provider.toLowerCase()}_user`);

      let user = getUserByUsername(username);
      if (!user) {
        user = createUser(randomUUID(), username, hashPassword(`sso_${provider}_${randomUUID()}`));
      }

      const sessionToken = randomUUID();
      recordUserSession(user.id, user.username, sessionToken);
      logUserActivity(user.id, 'sso_login', { provider, username: user.username });

      return {
        success: true,
        token: sessionToken,
        user: { id: user.id, username: user.username, provider }
      };
    } catch (e: any) {
      fastify.log.error(e);
      return reply.status(500).send({ error: 'SSO authentication failed' });
    }
  });

  // Get Settings (API keys & Enterprise Cloud AI)
  fastify.get('/api/settings', async (request, reply) => {
    const settings = getAllSettings();
    return {
      openaiApiKey: settings['openai_api_key'] ? maskKey(settings['openai_api_key']) : '',
      geminiApiKey: settings['gemini_api_key'] ? maskKey(settings['gemini_api_key']) : '',
      anthropicApiKey: settings['anthropic_api_key'] ? maskKey(settings['anthropic_api_key']) : '',
      hasOpenaiKey: Boolean(settings['openai_api_key'] || process.env.OPENAI_API_KEY),
      hasGeminiKey: Boolean(settings['gemini_api_key'] || process.env.GEMINI_API_KEY),
      hasAnthropicKey: Boolean(settings['anthropic_api_key'] || process.env.ANTHROPIC_API_KEY),

      // Azure AI Foundry / Azure OpenAI
      azureOpenaiEndpoint: settings['azure_openai_endpoint'] || process.env.AZURE_OPENAI_ENDPOINT || '',
      azureOpenaiApiKey: settings['azure_openai_api_key'] ? maskKey(settings['azure_openai_api_key']) : '',
      azureOpenaiDeployment: settings['azure_openai_deployment'] || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
      azureOpenaiApiVersion: settings['azure_openai_api_version'] || '2024-06-01',
      hasAzureOpenai: Boolean((settings['azure_openai_api_key'] || process.env.AZURE_OPENAI_API_KEY) && (settings['azure_openai_endpoint'] || process.env.AZURE_OPENAI_ENDPOINT)),

      // AWS Bedrock
      awsBedrockRegion: settings['aws_bedrock_region'] || process.env.AWS_REGION || 'us-east-1',
      awsBedrockAccessKey: settings['aws_bedrock_access_key'] ? maskKey(settings['aws_bedrock_access_key']) : '',
      awsBedrockSecretKey: settings['aws_bedrock_secret_key'] ? maskKey(settings['aws_bedrock_secret_key']) : '',
      awsBedrockSessionToken: settings['aws_bedrock_session_token'] ? maskKey(settings['aws_bedrock_session_token']) : '',
      awsBedrockModel: settings['aws_bedrock_model'] || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      hasAwsBedrock: Boolean(
        (settings['aws_bedrock_access_key'] || process.env.AWS_ACCESS_KEY_ID) &&
        (settings['aws_bedrock_secret_key'] || process.env.AWS_SECRET_ACCESS_KEY)
      ),

      // OCI GenAI
      ociGenaiRegion: settings['oci_genai_region'] || 'us-chicago-1',
      ociGenaiCompartmentId: settings['oci_genai_compartment_id'] ? maskKey(settings['oci_genai_compartment_id']) : '',
      ociGenaiApiKey: settings['oci_genai_api_key'] ? maskKey(settings['oci_genai_api_key']) : '',
      ociGenaiModel: settings['oci_genai_model'] || 'cohere.command-r-plus',
      hasOciGenai: Boolean(
        (settings['oci_genai_compartment_id'] || process.env.OCI_COMPARTMENT_ID) &&
        (settings['oci_genai_api_key'] || process.env.OCI_GENAI_API_KEY)
      )
    };
  });

  // Save Settings (API keys & Enterprise Cloud AI)
  fastify.post('/api/settings', async (request, reply) => {
    const body = (request.body as any) || {};

    if (body.openaiApiKey !== undefined && !body.openaiApiKey.includes('••••')) {
      setSetting('openai_api_key', body.openaiApiKey.trim());
    }
    if (body.geminiApiKey !== undefined && !body.geminiApiKey.includes('••••')) {
      setSetting('gemini_api_key', body.geminiApiKey.trim());
    }
    if (body.anthropicApiKey !== undefined && !body.anthropicApiKey.includes('••••')) {
      setSetting('anthropic_api_key', body.anthropicApiKey.trim());
    }

    // Azure AI Foundry
    if (body.azureOpenaiEndpoint !== undefined) {
      setSetting('azure_openai_endpoint', body.azureOpenaiEndpoint.trim());
    }
    if (body.azureOpenaiApiKey !== undefined && !body.azureOpenaiApiKey.includes('••••')) {
      setSetting('azure_openai_api_key', body.azureOpenaiApiKey.trim());
    }
    if (body.azureOpenaiDeployment !== undefined) {
      setSetting('azure_openai_deployment', body.azureOpenaiDeployment.trim());
    }
    if (body.azureOpenaiApiVersion !== undefined) {
      setSetting('azure_openai_api_version', body.azureOpenaiApiVersion.trim());
    }

    // AWS Bedrock
    if (body.awsBedrockRegion !== undefined) {
      setSetting('aws_bedrock_region', body.awsBedrockRegion.trim());
    }
    if (body.awsBedrockAccessKey !== undefined && !body.awsBedrockAccessKey.includes('••••')) {
      setSetting('aws_bedrock_access_key', body.awsBedrockAccessKey.trim());
    }
    if (body.awsBedrockSecretKey !== undefined && !body.awsBedrockSecretKey.includes('••••')) {
      setSetting('aws_bedrock_secret_key', body.awsBedrockSecretKey.trim());
    }
    if (body.awsBedrockSessionToken !== undefined && !body.awsBedrockSessionToken.includes('••••')) {
      setSetting('aws_bedrock_session_token', body.awsBedrockSessionToken.trim());
    }
    if (body.awsBedrockModel !== undefined) {
      setSetting('aws_bedrock_model', body.awsBedrockModel.trim());
    }

    // OCI GenAI
    if (body.ociGenaiRegion !== undefined) {
      setSetting('oci_genai_region', body.ociGenaiRegion.trim());
    }
    if (body.ociGenaiCompartmentId !== undefined && !body.ociGenaiCompartmentId.includes('••••')) {
      setSetting('oci_genai_compartment_id', body.ociGenaiCompartmentId.trim());
    }
    if (body.ociGenaiApiKey !== undefined && !body.ociGenaiApiKey.includes('••••')) {
      setSetting('oci_genai_api_key', body.ociGenaiApiKey.trim());
    }
    if (body.ociGenaiModel !== undefined) {
      setSetting('oci_genai_model', body.ociGenaiModel.trim());
    }

    return { success: true };
  });

  // Delete a specific provider configuration
  fastify.delete('/api/settings/keys/:provider', async (request, reply) => {
    const { provider } = request.params as { provider: string };
    const p = String(provider).toLowerCase();
    if (p === 'openai') setSetting('openai_api_key', '');
    else if (p === 'gemini') setSetting('gemini_api_key', '');
    else if (p === 'anthropic') setSetting('anthropic_api_key', '');
    else if (p === 'azure') {
      setSetting('azure_openai_endpoint', '');
      setSetting('azure_openai_api_key', '');
      setSetting('azure_openai_deployment', '');
    } else if (p === 'bedrock') {
      setSetting('aws_bedrock_access_key', '');
      setSetting('aws_bedrock_secret_key', '');
      setSetting('aws_bedrock_session_token', '');
    } else if (p === 'oci') {
      setSetting('oci_genai_compartment_id', '');
      setSetting('oci_genai_api_key', '');
    }
    return { success: true };
  });
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
