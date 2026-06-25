import { Router } from 'express';
import {
  getExperiences,
  getExperienceById,
  createExperience,
  updateExperience,
  deleteExperience,
} from './experiences.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', getExperiences);
router.get('/:id', getExperienceById);
router.post('/', authenticate, createExperience);
router.put('/:id', authenticate, updateExperience);
router.delete('/:id', authenticate, deleteExperience);

export default router;
