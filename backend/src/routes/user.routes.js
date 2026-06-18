import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { createUserSchema, updateUserRoleSchema, userIdSchema } from '../validators/user.validators.js';
import * as user from '../controllers/user.controller.js';

const router = Router();
router.use(authenticate);

// Listing members is ADMIN/MANAGER (managers assign tasks); mutations are ADMIN-only.
router.get('/', requireRole(['ADMIN', 'MANAGER']), user.listUsers);
router.post('/', requireRole(['ADMIN']), validate(createUserSchema), user.createUser);
router.patch('/:id/role', requireRole(['ADMIN']), validate(updateUserRoleSchema), user.updateUserRole);
router.delete('/:id', requireRole(['ADMIN']), validate(userIdSchema), user.deleteUser);

export default router;
