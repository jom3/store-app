import { Router } from 'express';
import { HttpError } from '../errors.js';
import { requireAuth } from './auth.middleware.js';
import { authenticate, changePassword } from './auth.service.js';
import { COOKIE_MAX_AGE, COOKIE_NAME, signToken } from './token.js';

export const authRouter = Router();

const toPublicUser = (user) => ({ id: user.id, username: user.username, role: user.role });

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

const setSessionCookie = (res, user) => {
  res.cookie(COOKIE_NAME, signToken(user), { ...cookieOptions(), maxAge: COOKIE_MAX_AGE });
};

authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim()) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Usuario y contraseña son obligatorios.');
    }

    const user = await authenticate(username.trim(), password);
    setSessionCookie(res, user);

    res.json({ user: toPublicUser(user), mustChangePassword: user.must_change_password });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.status(204).end();
});

authRouter.get('/me', requireAuth({ allowPasswordChange: true }), (req, res) => {
  res.json({ user: toPublicUser(req.user), mustChangePassword: req.user.must_change_password });
});

authRouter.post(
  '/change-password',
  requireAuth({ allowPasswordChange: true }),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body ?? {};

      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Las contraseñas son obligatorias.');
      }

      const user = await changePassword(req.user.id, currentPassword, newPassword);
      setSessionCookie(res, user);

      res.json({ user: toPublicUser(user), mustChangePassword: false });
    } catch (error) {
      next(error);
    }
  },
);
