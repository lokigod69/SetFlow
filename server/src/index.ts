import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes.js';
import { registerSpotifyAuth } from './spotify/auth.js';
import { settingsStore } from './config.js';

export async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] });
  registerRoutes(app);
  registerSpotifyAuth(app, settingsStore);
  return app;
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const app = await buildApp();
  await app.listen({ port: 8321, host: '127.0.0.1' });
}
