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

// Serve compiled web frontend if built
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
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
