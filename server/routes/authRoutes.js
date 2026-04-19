import express from 'express';
import { login, logout, me, refresh, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validateMiddleware.js';
import { loginSchema, refreshSchema, registerSchema } from '../utils/schemas.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

export default router;
