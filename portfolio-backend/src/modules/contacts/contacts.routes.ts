import { Router } from 'express';
import {
  submitContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStats,
} from './contacts.controller';
import { authenticate } from '../../middleware/auth';
import { contactRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public — submit contact form
router.post('/', contactRateLimiter, submitContact);

// Admin
router.get('/', authenticate, getContacts);
router.get('/stats', authenticate, getContactStats);
router.get('/:id', authenticate, getContactById);
router.patch('/:id/status', authenticate, updateContactStatus);
router.delete('/:id', authenticate, deleteContact);

export default router;
