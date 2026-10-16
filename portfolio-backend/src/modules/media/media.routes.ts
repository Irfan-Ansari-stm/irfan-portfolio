import { Router } from 'express';
import { getMediaList, uploadMedia, deleteMedia } from './media.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

// List all media (with search and type filter)
router.get('/', authenticate, getMediaList);

// Upload single or multiple media files
router.post('/upload', authenticate, upload.array('files', 20), uploadMedia);

// Delete media item
router.delete('/:id', authenticate, deleteMedia);

export default router;

