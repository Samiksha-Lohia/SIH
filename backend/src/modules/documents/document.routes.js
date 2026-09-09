import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../middleware/upload.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './document.controller.js';
import { verifySchema, listQuery, idParamSchema } from './document.validation.js';

const VERIFIERS = [ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY];

export const documentRouter = Router();
documentRouter.use(authenticate);

documentRouter.post('/', upload.single('file'), ctrl.uploadDocument);
documentRouter.get('/me', validate({ query: listQuery }), ctrl.listMine);
documentRouter.get('/:id', validate({ params: idParamSchema }), ctrl.getDocument);
documentRouter.delete('/:id', validate({ params: idParamSchema }), ctrl.deleteDocument);
documentRouter.patch(
  '/:id/verify',
  requireRole(VERIFIERS),
  validate({ params: idParamSchema, body: verifySchema }),
  ctrl.verifyDocument
);

export default documentRouter;
