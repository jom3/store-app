import '../src/config.js';
import pg from 'pg';
import { runMigrations } from '../src/db/migrate.js';

export default async function globalSetup() {
  const testUrl = process.env.TEST_DATABASE_URL;

  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL is required to run the tests');
  }

  if (testUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL');
  }

  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  } finally {
    await client.end();
  }

  await runMigrations(testUrl);
}
