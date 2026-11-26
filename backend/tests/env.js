import '../src/config.js';

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is required to run the tests');
}

if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL must differ from DATABASE_URL');
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
