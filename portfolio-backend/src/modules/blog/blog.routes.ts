import { Router } from 'express';
import {
  getPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  uploadCoverImage,
} from './blog.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

// ── Public ───────────────────────────────────────────────────
router.get('/', getPosts);
router.get('/slug/:slug', getPostBySlug);

// ── Admin ────────────────────────────────────────────────────
router.get('/admin/all', authenticate, getPosts);       // includes drafts
router.get('/:id', getPostById);
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);
router.patch('/:id/publish', authenticate, publishPost);
router.post('/:id/cover', authenticate, upload.single('cover'), uploadCoverImage);

export default router;
