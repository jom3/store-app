import cookieParser from 'cookie-parser';
import express from 'express';
import { authRouter } from './auth/auth.routes.js';
import { requireAuth, requireRole } from './auth/auth.middleware.js';
import { pool } from './db/pool.js';
import { errorHandler } from './errors.js';

export const createApp = (db = pool) => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', async (req, res, next) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', authRouter);

  app.use('/api', requireAuth());

  app.get('/api/admin/ping', requireRole('admin'), (req, res) => {
    res.json({ ok: true });
  });

  app.use(errorHandler);

  return app;
};
