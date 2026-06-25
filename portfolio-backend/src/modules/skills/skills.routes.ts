import { Router } from 'express';
import {
  getSkills,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
} from './skills.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public
router.get('/', getSkills);
router.get('/categories', getCategories);

// Admin — categories
router.post('/categories', authenticate, createCategory);
router.put('/categories/reorder', authenticate, reorderSkills);
router.put('/categories/:id', authenticate, updateCategory);
router.delete('/categories/:id', authenticate, deleteCategory);

// Admin — skills
router.post('/', authenticate, createSkill);
router.put('/:id', authenticate, updateSkill);
router.delete('/:id', authenticate, deleteSkill);

export default router;
