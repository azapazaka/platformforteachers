import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// В продакшене папку api/ обслуживает Vercel. Локально этот плагин
// вызывает те же обработчики, чтобы `npm run dev` работал без Vercel CLI.
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/([a-z-]+)(?:\?.*)?$/);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.js`);
          const handler = mod[req.method];
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            return res.end();
          }
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const request = new Request(new URL(req.url, 'http://localhost'), {
            method: req.method,
            headers: { 'content-type': req.headers['content-type'] ?? '' },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Делаем GROQ_API_KEY и GROQ_MODEL из .env доступными серверным обработчикам.
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'GROQ_'));
  return {
    plugins: [react(), devApi()],
  };
});
