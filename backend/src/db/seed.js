import '../config.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import pg from 'pg';

export async function seedDatabase(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const username = process.env.DEFAULT_ADMIN_USERNAME ?? 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('DEFAULT_ADMIN_PASSWORD is required');
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO users (username, password_hash, role, is_active, must_change_password)
       SELECT $1, $2, 'admin', true, true
       WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(username) = lower($1))`,
      [username, passwordHash],
    );

    await client.query(
      `INSERT INTO settings (id, business_name, currency_code, locale, timezone)
       VALUES (1, $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         business_name = EXCLUDED.business_name,
         currency_code = EXCLUDED.currency_code,
         locale = EXCLUDED.locale,
         timezone = EXCLUDED.timezone`,
      [
        process.env.BUSINESS_NAME ?? 'Supermercado',
        process.env.CURRENCY_CODE ?? 'PYG',
        process.env.LOCALE ?? 'es-PY',
        process.env.TZ ?? 'America/Asuncion',
      ],
    );

    console.log(`Seed listo. Admin por defecto: ${username}`);
  } finally {
    await client.end();
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  seedDatabase().catch((error) => {
    console.error(`No se pudo ejecutar el seed: ${error.message}`);
    process.exit(1);
  });
}
