import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import chatRoutes from './routes/chat';
import workspaceRoutes from './routes/workspace';
import authRoutes from './routes/auth';
import db from './db';

const server = fastify({ logger: true });

// Register the chat, workspace and auth routes
server.register(chatRoutes);
server.register(workspaceRoutes);
server.register(authRoutes);

server.get('/health', async (request, reply) => {
  return { status: 'ok' };
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
    if (request.raw.url && request.raw.url.startsWith('/api')) {
      reply.status(404).send({ error: 'API route not found' });
    } else {
      reply.sendFile('index.html');
    }
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

const start = async () => {
  try {
    console.log('Database initialized in WAL mode');
    const port = Number(process.env.PORT) || 3080;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`TerraMind Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
