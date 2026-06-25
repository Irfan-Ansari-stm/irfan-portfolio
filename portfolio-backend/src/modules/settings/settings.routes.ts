import { Router } from 'express';
import { getSettings, updateSettings, uploadAvatar } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

// GET  /api/settings   (public)
router.get('/', getSettings);

// PUT  /api/settings   (admin only)
router.put('/', authenticate, updateSettings);

// POST /api/settings/avatar
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

// POST /api/settings/resume — just update owner_resume_url field
router.post('/resume', authenticate, updateSettings);

export default router;
