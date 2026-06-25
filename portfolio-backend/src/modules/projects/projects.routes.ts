import { Router } from 'express';
import {
  getProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addScreenshot,
  deleteScreenshot,
  reorderScreenshots,
  uploadThumbnail,
} from './projects.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

// ── Public ───────────────────────────────────────────────────
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/slug/:slug', getProjectBySlug);
router.get('/:id', getProjectById);

// ── Admin ────────────────────────────────────────────────────
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

// Screenshots
router.post('/:id/screenshots', authenticate, addScreenshot);
router.delete('/:id/screenshots/:screenshotId', authenticate, deleteScreenshot);
router.put('/:id/screenshots/reorder', authenticate, reorderScreenshots);

// Thumbnail upload
router.post('/:id/thumbnail', authenticate, upload.single('thumbnail'), uploadThumbnail);

export default router;
