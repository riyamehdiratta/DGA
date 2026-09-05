import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { sessionMiddleware } from './middleware/session.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Populated at production build time by copying the frontend's built
 * `dist/` here so a single Express process can serve both the API and the
 * app (a combined same-origin deployment). Absent in dev, and absent when
 * the frontend is hosted separately (e.g. Vercel) — the check below makes
 * that the case that silently does nothing rather than something to
 * configure.
 */
const STATIC_DIR = path.join(__dirname, 'public');

export function createApp() {
  const app = express();

  if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  // CORS only needs to be configured for a cross-origin frontend (e.g. a
  // separately-hosted Vercel deployment). A same-origin/combined deployment
  // never sends cross-origin requests, so CORS_ORIGIN can stay unset and
  // this block is skipped entirely.
  if (process.env.CORS_ORIGIN) {
    app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  }
  app.use(express.json());
  app.use(sessionMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', routes);

  if (fs.existsSync(STATIC_DIR)) {
    app.use(express.static(STATIC_DIR));
    // SPA fallback: any non-API GET that didn't match a static file is a
    // client-side route (e.g. /learn, /transformers/:id) — hand it index.html.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(STATIC_DIR, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
