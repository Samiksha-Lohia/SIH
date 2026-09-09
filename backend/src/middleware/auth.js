import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import { isDBConnected } from '../config/db.js';
import { User } from '../modules/auth/user.model.js';
import { USER_STATUS } from '../config/constants.js';

/**
 * Extracts a Bearer token from the Authorization header.
 */
function getBearer(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Requires a valid access token. Loads the user and attaches it to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const token = getBearer(req);
    if (!token) throw ApiError.unauthorized('Authentication required', { code: 'NO_TOKEN' });

    const payload = verifyToken(token);
    if (payload.type && payload.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type', { code: 'INVALID_TOKEN_TYPE' });
    }

    if (!isDBConnected()) {
      throw ApiError.serviceUnavailable('Database unavailable', { code: 'DB_UNAVAILABLE' });
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('User no longer exists', { code: 'USER_NOT_FOUND' });
    if (user.status === USER_STATUS.SUSPENDED) {
      throw ApiError.forbidden('Account suspended', { code: 'ACCOUNT_SUSPENDED' });
    }

    req.user = user;
    req.auth = { userId: String(user._id), role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth: attaches req.user if a valid token is present, else continues
 * anonymously. Useful for endpoints with public + enhanced authenticated views.
 */
export async function optionalAuth(req, res, next) {
  const token = getBearer(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    if (isDBConnected()) {
      const user = await User.findById(payload.sub);
      if (user && user.status !== USER_STATUS.SUSPENDED) {
        req.user = user;
        req.auth = { userId: String(user._id), role: user.role };
      }
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export default authenticate;
