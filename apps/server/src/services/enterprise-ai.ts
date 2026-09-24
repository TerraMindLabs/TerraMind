import crypto from 'crypto';

export interface EnterpriseSettings {
  azureOpenaiEndpoint?: string;
  azureOpenaiApiKey?: string;
  azureOpenaiDeployment?: string;
  azureOpenaiApiVersion?: string;

  awsBedrockRegion?: string;
  awsBedrockAccessKey?: string;
  awsBedrockSecretKey?: string;
  awsBedrockSessionToken?: string;
  awsBedrockModel?: string;

  ociGenaiRegion?: string;
  ociGenaiCompartmentId?: string;
  ociGenaiApiKey?: string;
  ociGenaiModel?: string;
}

// ----------------------------------------------------------------------
// AWS SigV4 Signer (Pure Node.js crypto, zero extra npm dependencies)
// ----------------------------------------------------------------------
function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

export function signAwsRequest(params: {
  method: string;
  url: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  body: string;
  headers?: Record<string, string>;
}): Record<string, string> {
  const { method, url, region, service, accessKeyId, secretAccessKey, sessionToken, body } = params;
  const parsedUrl = new URL(url);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    host: parsedUrl.host,
    'x-amz-date': amzDate,
    'content-type': 'application/json',
    ...(params.headers || {})
  };

  if (sessionToken) {
    headers['x-amz-security-token'] = sessionToken;
  }

  const payloadHash = sha256Hex(body);
  headers['x-amz-content-sha256'] = payloadHash;

  const signedHeadersKeys = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort();
  const signedHeaders = signedHeadersKeys.join(';');

  const canonicalHeaders = signedHeadersKeys
    .map((k) => `${k}:${headers[k].trim()}\n`)
    .join('');

  const canonicalRequest = [
    method.toUpperCase(),
    parsedUrl.pathname,
    parsedUrl.search.replace(/^\?/, ''),
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...headers,
    Authorization: authHeader
  };
}

// ----------------------------------------------------------------------
// 1. AWS Bedrock Runtime Invocation
// ----------------------------------------------------------------------
export async function invokeBedrockConverse(params: {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  modelId: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  onToken: (token: string) => void;
}): Promise<boolean> {
  const { region, accessKeyId, secretAccessKey, sessionToken, modelId, systemPrompt, messages, onToken } = params;

  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;

  // Format messages for Bedrock Converse API
  const bedrockMessages: Array<{ role: 'user' | 'assistant'; content: Array<{ text: string }> }> = [];

  for (const m of messages) {
    if (!m.content || !m.content.trim()) continue;
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    // AWS Bedrock requires alternating roles and starting with user
    if (bedrockMessages.length === 0 && role === 'assistant') {
      bedrockMessages.push({ role: 'user', content: [{ text: 'Initialize architecture consultation.' }] });
    }
    const lastMsg = bedrockMessages[bedrockMessages.length - 1];
    if (lastMsg && lastMsg.role === role) {
      lastMsg.content.push({ text: m.content });
    } else {
      bedrockMessages.push({ role, content: [{ text: m.content }] });
    }
  }

  if (bedrockMessages.length === 0) {
    bedrockMessages.push({ role: 'user', content: [{ text: 'Hello' }] });
  }

  const payloadObj = {
    system: [{ text: systemPrompt }],
    messages: bedrockMessages,
    inferenceConfig: {
      maxTokens: 4096,
      temperature: 0.7
    }
  };

  const bodyStr = JSON.stringify(payloadObj);
  const signedHeaders = signAwsRequest({
    method: 'POST',
    url,
    region,
    service: 'bedrock',
    accessKeyId,
    secretAccessKey,
    sessionToken,
    body: bodyStr
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: signedHeaders,
    body: bodyStr
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr = errText;
    try {
      const j = JSON.parse(errText);
      parsedErr = j.message || errText;
    } catch {}
    throw new Error(`AWS Bedrock Error (${res.status}): ${parsedErr}`);
  }

  const data = (await res.json()) as any;
  const replyText =
    data.output?.message?.content?.[0]?.text ||
    data.output?.text ||
    '';

  if (!replyText) {
    throw new Error('AWS Bedrock returned an empty response.');
  }

  // Stream in small realistic chunks so client SSE renders smoothly
  const words = replyText.split(/(?<=\s+)/);
  for (const chunk of words) {
    onToken(chunk);
  }

  return true;
}

// ----------------------------------------------------------------------
// 2. Azure AI Foundry / Azure OpenAI Streaming Invocation
// ----------------------------------------------------------------------
export async function streamAzureFoundry(params: {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion?: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  onToken: (token: string) => void;
}): Promise<boolean> {
  const { endpoint, apiKey, deploymentName, apiVersion = '2024-06-01', systemPrompt, messages, onToken } = params;

  let cleanEndpoint = endpoint.trim().replace(/\/+$/, '');
  let targetUrl = '';

  // Case A: Serverless Foundry Models endpoint (e.g. https://<name>.services.ai.azure.com/models)
  if (cleanEndpoint.includes('.services.ai.azure.com')) {
    targetUrl = `${cleanEndpoint}/chat/completions`;
  } else {
    // Case B: Standard Azure OpenAI deployment endpoint
    if (!cleanEndpoint.includes('/openai/deployments')) {
      targetUrl = `${cleanEndpoint}/openai/deployments/${encodeURIComponent(deploymentName)}/chat/completions?api-version=${apiVersion}`;
    } else {
      targetUrl = `${cleanEndpoint}/chat/completions?api-version=${apiVersion}`;
    }
  }

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || ' '
    }))
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'api-key': apiKey,
    Authorization: `Bearer ${apiKey}`
  };

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: formattedMessages,
      stream: true,
      max_tokens: 4096
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = errText;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.error?.message || errText;
    } catch {}
    throw new Error(`Azure AI Foundry Error (${res.status}): ${msg}`);
  }

  if (!res.body) {
    throw new Error('Azure AI Foundry response body is empty.');
  }

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
      const raw = line.replace('data: ', '').trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const parsed = JSON.parse(raw);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) onToken(token);
      } catch {}
    }
  }

  return true;
}

// ----------------------------------------------------------------------
// 3. Oracle Cloud Infrastructure (OCI) Generative AI Invocation
// ----------------------------------------------------------------------
export async function invokeOciGenAi(params: {
  region: string;
  compartmentId: string;
  apiKey: string;
  modelId?: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  onToken: (token: string) => void;
}): Promise<boolean> {
  const { region, compartmentId, apiKey, modelId = 'cohere.command-r-plus', systemPrompt, messages, onToken } = params;

  const url = `https://inference.generativeai.${region || 'us-chicago-1'}.oci.oraclecloud.com/20231130/actions/chat`;

  const latestUser = messages[messages.length - 1]?.content || 'Infrastructure request';
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: m.content
  }));

  const payload = {
    compartmentId,
    servingMode: {
      servingType: 'ON_DEMAND',
      modelId
    },
    chatRequest: {
      apiFormat: 'GENERIC',
      message: latestUser,
      preambleOverride: systemPrompt,
      chatHistory: history,
      maxTokens: 4000,
      temperature: 0.7
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = errText;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.message || errText;
    } catch {}
    throw new Error(`OCI GenAI Error (${res.status}): ${msg}`);
  }

  const data = (await res.json()) as any;
  const reply = data.chatResponse?.text || data.chatResponse?.message || '';

  if (!reply) {
    throw new Error('OCI GenAI returned an empty response.');
  }

  const words = reply.split(/(?<=\s+)/);
  for (const chunk of words) {
    onToken(chunk);
  }

  return true;
}
