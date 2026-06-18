import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

// Exported separately from server.js so tests can use the app without a port.
export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', routes);
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
