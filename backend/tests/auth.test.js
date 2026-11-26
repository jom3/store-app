import request from 'supertest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth/password.js';
import { pool } from '../src/db/pool.js';

const app = createApp();

const createUser = async ({
  username = 'vendedor',
  password = 'secret123',
  role = 'seller',
  isActive = true,
  mustChangePassword = false,
} = {}) => {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role, is_active, must_change_password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, role`,
    [username, passwordHash, role, isActive, mustChangePassword],
  );

  return rows[0];
};

const login = (agent, username, password) =>
  agent.post('/api/auth/login').send({ username, password });

describe('POST /api/auth/login', () => {
  it('returns the user and an httpOnly session cookie', async () => {
    await createUser({ username: 'vendedor' });
    const agent = request.agent(app);

    const response = await login(agent, 'vendedor', 'secret123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { id: expect.any(Number), username: 'vendedor', role: 'seller' },
      mustChangePassword: false,
    });
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('rejects unknown users, wrong passwords and disabled users with the same message', async () => {
    await createUser({ username: 'vendedor' });
    await createUser({ username: 'deshabilitado', isActive: false });
    const agent = request.agent(app);

    const unknown = await login(agent, 'nadie', 'secret123');
    const wrongPassword = await login(agent, 'vendedor', 'incorrecta');
    const disabled = await login(agent, 'deshabilitado', 'secret123');

    for (const response of [unknown, wrongPassword, disabled]) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Usuario o contraseña incorrectos.',
        },
      });
    }
  });

  it('never exposes or stores the plaintext password', async () => {
    await createUser({ username: 'vendedor', password: 'secret123' });
    const agent = request.agent(app);

    const response = await login(agent, 'vendedor', 'secret123');
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE username = $1', [
      'vendedor',
    ]);

    expect(JSON.stringify(response.body)).not.toContain('secret123');
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(rows[0].password_hash).not.toBe('secret123');
    expect(rows[0].password_hash.startsWith('$2')).toBe(true);
  });
});

describe('session endpoints', () => {
  it('returns 401 without a session cookie', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns the authenticated user', async () => {
    await createUser({ username: 'vendedor' });
    const agent = request.agent(app);
    await login(agent, 'vendedor', 'secret123');

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { id: expect.any(Number), username: 'vendedor', role: 'seller' },
      mustChangePassword: false,
    });
  });

  it('clears the session on logout', async () => {
    await createUser({ username: 'vendedor' });
    const agent = request.agent(app);
    await login(agent, 'vendedor', 'secret123');

    const logout = await agent.post('/api/auth/logout');
    const me = await agent.get('/api/auth/me');

    expect(logout.status).toBe(204);
    expect(me.status).toBe(401);
  });
});

describe('forced password change', () => {
  it('blocks the API until the password is changed', async () => {
    await createUser({
      username: 'admin',
      role: 'admin',
      password: 'temporal123',
      mustChangePassword: true,
    });
    const agent = request.agent(app);

    const session = await login(agent, 'admin', 'temporal123');
    const blocked = await agent.get('/api/admin/ping');
    const me = await agent.get('/api/auth/me');

    expect(session.body.mustChangePassword).toBe(true);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect(me.status).toBe(200);

    const wrongCurrent = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'incorrecta', newPassword: 'nueva1234' });
    expect(wrongCurrent.status).toBe(400);
    expect(wrongCurrent.body.error.code).toBe('INVALID_CURRENT_PASSWORD');

    const shortPassword = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'temporal123', newPassword: 'corta' });
    expect(shortPassword.status).toBe(400);
    expect(shortPassword.body.error.code).toBe('WEAK_PASSWORD');

    const changed = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'temporal123', newPassword: 'nueva1234' });

    expect(changed.status).toBe(200);
    expect(changed.body.mustChangePassword).toBe(false);

    const allowed = await agent.get('/api/admin/ping');
    expect(allowed.status).toBe(200);
  });
});

describe('role enforcement', () => {
  it('rejects a seller on an admin-only route', async () => {
    await createUser({ username: 'vendedor', role: 'seller' });
    const agent = request.agent(app);
    await login(agent, 'vendedor', 'secret123');

    const response = await agent.get('/api/admin/ping');

    expect(response.status).toBe(403);
    expect(response.body.error).toEqual({
      code: 'FORBIDDEN',
      message: 'No tenés permiso para esta acción.',
    });
  });
});
