import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { query } from '../../db/pool';
import { successResponse, errorResponse } from '../../utils/response';
import { env } from '../../config/env';
import { AuthenticatedRequest } from '../../types';

const hasCloudinary = () => {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET &&
    env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  );
};

export async function getMediaList(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, type, limit = '60', offset = '0' } = req.query;
    const l = Math.min(100, Math.max(1, parseInt(limit as string) || 60));
    const o = Math.max(0, parseInt(offset as string) || 0);

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (search && typeof search === 'string' && search.trim()) {
      conditions.push(`(original_name ILIKE $${idx} OR filename ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    if (type && typeof type === 'string' && type !== 'all') {
      conditions.push(`file_type = $${idx}`);
      values.push(type);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM media ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0');

    values.push(l);
    values.push(o);
    const dataRes = await query(
      `SELECT * FROM media ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    return successResponse(res, {
      items: dataRes.rows,
      total,
      limit: l,
      offset: o,
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const files: Express.Multer.File[] = [];
    if (req.files && Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (req.file) {
      files.push(req.file);
    }

    if (files.length === 0) {
      return errorResponse(res, 'No files were provided for upload', 400);
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const uploadedMedia = [];

    for (const file of files) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');
      const isDoc = file.mimetype === 'application/pdf';
      const fileType = isImage ? 'image' : isVideo ? 'video' : isDoc ? 'document' : 'other';

      let fileUrl = `${baseUrl}/uploads/${file.filename}`;
      let publicId: string | null = null;

      // Try uploading to Cloudinary if configured
      if (hasCloudinary()) {
        try {
          const resCloud = await cloudinary.uploader.upload(file.path, {
            folder: 'portfolio/media',
            resource_type: isVideo ? 'video' : isImage ? 'image' : 'auto',
            use_filename: true,
            unique_filename: true,
          });
          if (resCloud?.secure_url) {
            fileUrl = resCloud.secure_url;
            publicId = resCloud.public_id;
            // Remove local temp file since it is hosted on Cloudinary
            try {
              if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            } catch (_) {}
          }
        } catch (cloudErr) {
          console.warn('Cloudinary upload fallback to local:', cloudErr);
        }
      }

      const insertRes = await query(
        `INSERT INTO media (filename, original_name, mime_type, file_type, size_bytes, url, public_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [file.filename, file.originalname, file.mimetype, fileType, file.size, fileUrl, publicId]
      );

      uploadedMedia.push(insertRes.rows[0]);
    }

    return successResponse(
      res,
      uploadedMedia.length === 1 ? uploadedMedia[0] : uploadedMedia,
      `${uploadedMedia.length} file(s) uploaded successfully`
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteMedia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const mediaRes = await query('SELECT * FROM media WHERE id = $1', [id]);
    if (mediaRes.rowCount === 0) {
      return errorResponse(res, 'Media item not found', 404);
    }

    const item = mediaRes.rows[0];

    // Delete local file if it exists
    if (item.filename) {
      const localPath = path.join(process.cwd(), 'uploads', item.filename);
      try {
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch (e) {
        console.warn('Could not delete local file:', e);
      }
    }

    // Delete from Cloudinary if public_id is present
    if (item.public_id && hasCloudinary()) {
      try {
        await cloudinary.uploader.destroy(item.public_id, {
          resource_type: item.file_type === 'video' ? 'video' : 'image',
        });
      } catch (e) {
        console.warn('Could not delete Cloudinary asset:', e);
      }
    }

    await query('DELETE FROM media WHERE id = $1', [id]);
    return successResponse(res, null, 'Media deleted successfully');
  } catch (err) {
    next(err);
  }
}

