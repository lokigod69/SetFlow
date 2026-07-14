// SETFLOW server entry — scaffold placeholder, replaced by the API build.
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/api/health', async () => ({ ok: true, service: 'setflow-server' }));

app.listen({ port: 8321, host: '127.0.0.1' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
