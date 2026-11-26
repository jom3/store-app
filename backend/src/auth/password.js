import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const MIN_PASSWORD_LENGTH = 8;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);
