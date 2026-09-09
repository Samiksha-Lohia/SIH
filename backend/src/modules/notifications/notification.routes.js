import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './notification.controller.js';

const idParam = z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id') });

export const notificationRouter = Router();
notificationRouter.use(authenticate);

// Literal paths before '/:id'.
notificationRouter.get('/unread-count', ctrl.unreadCount);
notificationRouter.post('/read-all', ctrl.markAllRead);
notificationRouter.get('/', ctrl.listMine);
notificationRouter.patch('/:id/read', validate({ params: idParam }), ctrl.markRead);
notificationRouter.delete('/:id', validate({ params: idParam }), ctrl.remove);

export default notificationRouter;
