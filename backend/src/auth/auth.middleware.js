import { HttpError } from '../errors.js';
import { findActiveUser } from './auth.service.js';
import { COOKIE_NAME, verifyToken } from './token.js';

const UNAUTHENTICATED = 'Debés iniciar sesión.';

export const requireAuth =
  ({ allowPasswordChange = false } = {}) =>
  async (req, res, next) => {
    try {
      const token = req.cookies?.[COOKIE_NAME];
      if (!token) {
        throw new HttpError(401, 'UNAUTHENTICATED', UNAUTHENTICATED);
      }

      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        throw new HttpError(401, 'UNAUTHENTICATED', UNAUTHENTICATED);
      }

      const user = await findActiveUser(payload.sub);
      if (!user) {
        throw new HttpError(401, 'UNAUTHENTICATED', UNAUTHENTICATED);
      }

      req.user = user;

      if (user.must_change_password && !allowPasswordChange) {
        throw new HttpError(
          403,
          'PASSWORD_CHANGE_REQUIRED',
          'Debés cambiar tu contraseña antes de continuar.',
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'UNAUTHENTICATED', UNAUTHENTICATED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'No tenés permiso para esta acción.'));
    }

    next();
  };
