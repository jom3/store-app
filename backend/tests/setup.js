import { pool } from '../src/db/pool.js';

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE users, settings RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});
