import './config.js';
import { createApp } from './app.js';
import { pool } from './db/pool.js';

const port = Number(process.env.PORT ?? 3000);

try {
  await pool.query('SELECT 1');
} catch (error) {
  console.error(`No se pudo conectar a la base de datos: ${error.message}`);
  process.exit(1);
}

createApp().listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
