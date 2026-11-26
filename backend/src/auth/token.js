import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'session';
export const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;

const TOKEN_TTL = '8h';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
};

export const signToken = (user) =>
  jwt.sign({ role: user.role }, getSecret(), {
    subject: String(user.id),
    expiresIn: TOKEN_TTL,
  });

export const verifyToken = (token) => jwt.verify(token, getSecret());
