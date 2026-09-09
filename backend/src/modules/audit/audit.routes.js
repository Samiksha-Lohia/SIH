import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import { ROLES } from '../../config/constants.js';
import { listAudit } from './audit.service.js';

/**
 * Admin-only audit log viewer.
 */
export const auditRouter = Router();

auditRouter.get(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await listAudit(req.query);
    sendSuccess(res, { logs: items.map((l) => l.toJSON()) }, { meta: paginationMeta({ page, limit, total }) });
  })
);

export default auditRouter;
