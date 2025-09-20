import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../schemas/validation.js';

const router = Router();

// POST /auth/register
router.post('/register', validateBody(registerSchema), AuthController.register);

// POST /auth/login
router.post('/login', validateBody(loginSchema), AuthController.login);

// GET /auth/me
router.get('/me', authMiddleware, AuthController.me);

export default router;