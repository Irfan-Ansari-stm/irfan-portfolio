import { Router } from 'express';
import {
  trackEvent,
  getDashboardStats,
  getEventTimeline,
  getTopPages,
  getTopProjects,
} from './analytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public — track events
router.post('/track', trackEvent);

// Admin — read stats
router.get('/dashboard', authenticate, getDashboardStats);
router.get('/timeline', authenticate, getEventTimeline);
router.get('/top-pages', authenticate, getTopPages);
router.get('/top-projects', authenticate, getTopProjects);

export default router;
