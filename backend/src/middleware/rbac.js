import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based access control. Use after `authenticate`.
 *   requireRole(ROLES.ADMIN)
 *   requireRole(ROLES.INDUSTRY, ROLES.ADMIN)
 */
export function requireRole(...allowed) {
  const roles = allowed.flat();
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to perform this action', {
          code: 'INSUFFICIENT_ROLE',
          details: { required: roles, actual: req.user.role },
        })
      );
    }
    next();
  };
}

/**
 * Ownership guard: allows the resource owner (matching :param) or an admin.
 * Compares req.params[paramName] to the authenticated user's id.
 */
export function requireSelfOrRoles(paramName = 'id', ...allowedRoles) {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    const isSelf = String(req.params[paramName]) === String(req.user._id);
    if (isSelf || roles.includes(req.user.role)) return next();
    return next(
      ApiError.forbidden('You can only access your own resource', { code: 'NOT_OWNER' })
    );
  };
}

export default requireRole;
