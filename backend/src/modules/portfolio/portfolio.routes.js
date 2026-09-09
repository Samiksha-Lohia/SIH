import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { strictLimiter } from '../../middleware/rateLimit.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './portfolio.controller.js';
import {
  createItemSchema,
  updateItemSchema,
  verifySchema,
  listItemsQuery,
  idParamSchema,
  userIdParamSchema,
} from './portfolio.validation.js';

const VERIFIERS = [ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY];

export const portfolioRouter = Router();

// Public share view (literal path before '/:id').
portfolioRouter.get('/share/:userId', optionalAuth, validate({ params: userIdParamSchema }), ctrl.getShareView);

portfolioRouter.get('/me', authenticate, validate({ query: listItemsQuery }), ctrl.listMine);
portfolioRouter.post('/', authenticate, validate({ body: createItemSchema }), ctrl.createItem);
portfolioRouter.post('/resume', authenticate, strictLimiter, ctrl.generateResume);

portfolioRouter.get('/:id', authenticate, validate({ params: idParamSchema }), ctrl.getItem);
portfolioRouter.put('/:id', authenticate, validate({ params: idParamSchema, body: updateItemSchema }), ctrl.updateItem);
portfolioRouter.delete('/:id', authenticate, validate({ params: idParamSchema }), ctrl.deleteItem);
portfolioRouter.patch(
  '/:id/verify',
  authenticate,
  requireRole(VERIFIERS),
  validate({ params: idParamSchema, body: verifySchema }),
  ctrl.verifyItem
);

export default portfolioRouter;
