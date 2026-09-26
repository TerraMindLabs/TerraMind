import './env';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

import chatRoutes from './routes/chat';
import workspaceRoutes from './routes/workspace';
import authRoutes from './routes/auth';
import mcpRoutes from './routes/mcp';
import db from './db';

const server = fastify({ logger: true });

// Register the chat, workspace, auth, and mcp routes
server.register(chatRoutes);
server.register(workspaceRoutes);
server.register(authRoutes);
server.register(mcpRoutes);

server.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Neutralize any legacy Service Worker from previous apps on port 3080
const unregisterSwScript = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll({ type: 'window' })).then((clients) => {
      for (const client of clients) client.navigate(client.url);
    })
  );
});
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
`;

server.get('/sw.js', async (request, reply) => {
  reply.header('Content-Type', 'application/javascript; charset=utf-8');
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return reply.send(unregisterSwScript);
});

server.get('/service-worker.js', async (request, reply) => {
  reply.header('Content-Type', 'application/javascript; charset=utf-8');
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return reply.send(unregisterSwScript);
});

// Resolve compiled web frontend
const possibleDistPaths = [
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../../../apps/web/dist'),
  path.resolve(__dirname, '../web/dist'),
  path.resolve(process.cwd(), 'dist')
];

const webDistPath = possibleDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (webDistPath) {
  server.register(fastifyStatic, {
    root: webDistPath,
    prefix: '/'
  });

  server.setNotFoundHandler((request, reply) => {
    const url = request.raw.url || '';
    if (url.startsWith('/api')) {
      return reply.status(404).send({ error: 'API route not found' });
    }
    // Static asset not found - return 404 instead of HTML to prevent syntax errors
    if (/\.(js|css|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url.split('?')[0])) {
      return reply.status(404).send({ error: 'Asset not found' });
    }
    // SPA fallback
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    return reply.sendFile('index.html');
  });
} else {
  server.get('/', async (request, reply) => {
    reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>TerraMind - Starting...</title></head>
        <body style="background:#0b0f19;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;padding:2rem;background:#1e293b;border-radius:12px;border:1px solid #334155;max-width:500px;">
            <h2 style="color:#38bdf8;">🧠 TerraMind Server is Running!</h2>
            <p>Frontend assets are building. Please run:</p>
            <code style="background:#0f172a;padding:8px 16px;border-radius:6px;display:inline-block;color:#4ade80;">npm run build</code>
            <p style="margin-top:16px;"><a href="/" style="color:#60a5fa;">Refresh Page</a></p>
          </div>
        </body>
      </html>
    `);
  });
}

// Guard against ERR_HTTP_HEADERS_SENT on SSE streams
server.setErrorHandler((error, request, reply) => {
  if (reply.raw.headersSent) {
    server.log.warn({ err: error }, 'Handled error after headers were already sent to client');
    try {
      reply.raw.end();
    } catch {}
    return;
  }
  reply.status((error as any).statusCode || 500).send({
    error: error.name || 'Internal Server Error',
    message: error.message
  });
});

process.on('uncaughtException', (err) => {
  console.error('[TerraMind] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[TerraMind] Unhandled Rejection:', reason?.message || reason);
});

const start = async () => {
  try {
    console.log('Database initialized in WAL mode');
    const port = Number(process.env.PORT) || 3080;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`TerraMind Server listening on http://localhost:${port}`);

    // Auto-detect and start Ollama in background if installed and not yet running
    setTimeout(async () => {
      try {
        const { getSetting } = await import('./db');
        const autoStart = getSetting('ollama_auto_start') !== 'false';
        if (!autoStart) {
          console.log('[Ollama] Auto-start is disabled in settings.');
          return;
        }

        const { isOllamaRunning, isOllamaInstalled, startOllamaDaemon, getOllamaBaseUrl } = await import('./services/ollama');
        const running = await isOllamaRunning();
        if (!running) {
          const installed = await isOllamaInstalled();
          if (installed.installed) {
            console.log('[Ollama] Auto-launching local Ollama server (listening on 0.0.0.0:11434 with port-forwarding enabled)...');
            const res = await startOllamaDaemon();
            if (res.running) {
              console.log('[Ollama] Local Ollama daemon started successfully on 0.0.0.0:11434.');
            }
          }
        } else {
          console.log(`[Ollama] Ollama server is active and responsive at ${getOllamaBaseUrl()}`);
        }
      } catch (err: any) {
        console.warn('[Ollama] Background startup notice:', err.message || err);
      }
    }, 1000);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
