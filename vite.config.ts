import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';

function apiDevPlugin() {
  return {
    name: 'api-dev-middleware',
    configureServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use('/api/chat', async (req, res, _next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const env = loadEnv('development', process.cwd(), 'AI_');
        for (const [key, value] of Object.entries(env)) {
          process.env[key] = value;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const { processChat } = await import('./api/chatLogic');
            const result = await processChat(parsed);
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.body));
          } catch (error) {
            console.error('Dev API error:', error instanceof Error ? error.message : String(error));
            const { safeFallbackResponse } = await import('./src/domain/aiResponse');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(safeFallbackResponse()));
          }
        });
      });
      server.middlewares.use('/api/knowledge', async (req, res, _next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const env = loadEnv('development', process.cwd(), 'AI_');
        for (const [key, value] of Object.entries(env)) {
          process.env[key] = value;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const { processKnowledge } = await import('./api/knowledgeLogic');
            const result = await processKnowledge(parsed);
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.body));
          } catch (error) {
            console.error('Dev knowledge API error:', error instanceof Error ? error.message : String(error));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              scenario: 'wellness_regulation',
              generatedAt: new Date().toISOString(),
              cards: [],
              disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
            }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'api/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
