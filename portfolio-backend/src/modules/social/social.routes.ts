import { Router } from 'express';
import {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
} from './social.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// GET  /api/social          (public)
router.get('/', getSocialLinks);

// POST /api/social          (admin)
router.post('/', authenticate, createSocialLink);

// PUT  /api/social/reorder  (admin)
router.put('/reorder', authenticate, reorderSocialLinks);

// PUT  /api/social/:id      (admin)
router.put('/:id', authenticate, updateSocialLink);

// DELETE /api/social/:id    (admin)
router.delete('/:id', authenticate, deleteSocialLink);

export default router;
