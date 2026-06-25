import { Router } from 'express';
import { login, refreshToken, logout, getMe, changePassword, setupAdmin } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// POST /api/auth/setup   — first-time admin creation
router.post('/setup', setupAdmin);

// POST /api/auth/login
router.post('/login', authRateLimiter, login);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout  (protected)
router.post('/logout', authenticate, logout);

// GET  /api/auth/me      (protected)
router.get('/me', authenticate, getMe);

// PUT  /api/auth/password (protected)
router.put('/password', authenticate, changePassword);

export default router;
