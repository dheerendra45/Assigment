import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validators.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), auth.register);
router.post('/login', validate(loginSchema), auth.login);
router.post('/refresh', validate(refreshSchema), auth.refresh);
router.post('/logout', validate(refreshSchema), auth.logout);
router.get('/me', authenticate, auth.me);

export default router;
