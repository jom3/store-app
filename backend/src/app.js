import express from 'express';
import { pool } from './db/pool.js';

export const createApp = (db = pool) => {
  const app = express();

  app.use(express.json());

  app.get('/api/health', async (req, res, next) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (error) {
      next(error);
    }
  });

  return app;
};
