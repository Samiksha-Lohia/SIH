import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Stateless JWT helpers. Access token carries the minimal claims needed for
 * authorization (id + role); everything else is fetched from the DB.
 */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id ?? user.id), role: user.role, type: 'access' },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id ?? user.id), type: 'refresh' },
    env.jwt.secret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}
