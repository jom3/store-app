import { pool } from '../db/pool.js';
import { HttpError } from '../errors.js';
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from './password.js';

const INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos.';

const USER_FIELDS = 'id, username, password_hash, role, is_active, must_change_password';

export async function authenticate(username, password) {
  const { rows } = await pool.query(
    `SELECT ${USER_FIELDS} FROM users WHERE lower(username) = lower($1)`,
    [username],
  );

  const user = rows[0];
  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS);
  }

  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword || !user.is_active) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS);
  }

  return user;
}

export async function findActiveUser(id) {
  const { rows } = await pool.query(
    `SELECT ${USER_FIELDS} FROM users WHERE id = $1 AND is_active = true`,
    [id],
  );

  return rows[0] ?? null;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const { rows } = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [userId]);
  const user = rows[0];

  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Debés iniciar sesión.');
  }

  const validPassword = await verifyPassword(currentPassword, user.password_hash);
  if (!validPassword) {
    throw new HttpError(400, 'INVALID_CURRENT_PASSWORD', 'La contraseña actual no es correcta.');
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(
      400,
      'WEAK_PASSWORD',
      `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }

  const passwordHash = await hashPassword(newPassword);
  const { rows: updatedRows } = await pool.query(
    `UPDATE users
     SET password_hash = $1, must_change_password = false
     WHERE id = $2
     RETURNING id, username, role, is_active, must_change_password`,
    [passwordHash, userId],
  );

  return updatedRows[0];
}
