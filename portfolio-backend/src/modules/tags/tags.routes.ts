import { Router } from 'express';
import { getAllTags, createTag, updateTag, deleteTag } from './tags.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', getAllTags);
router.post('/', authenticate, createTag);
router.put('/:id', authenticate, updateTag);
router.delete('/:id', authenticate, deleteTag);

export default router;
