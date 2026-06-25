import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool';
import { successResponse } from '../../utils/response';
import { uploadImage } from '../../utils/cloudinary';
import { AuthenticatedRequest } from '../../types';

const updateSchema = z.object({
  owner_name: z.string().min(1).optional(),
  owner_title: z.string().optional(),
  owner_email: z.string().email().optional(),
  owner_location: z.string().optional(),
  owner_avatar_url: z.string().url().optional(),
  owner_resume_url: z.string().url().optional(),
  hero_taglines: z.array(z.string()).optional(),
  hero_bio_short: z.string().optional(),
  about_bio: z.string().optional(),
  about_years_exp: z.number().int().min(0).optional(),
  about_projects_count: z.number().int().min(0).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image_url: z.string().url().optional(),
  notify_email: z.string().email().optional(),
}).partial();

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query('SELECT * FROM site_settings LIMIT 1');
    return successResponse(res, result.rows[0] || null);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) return successResponse(res, null, 'No fields to update');

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = keys.map(k => (data as any)[k]);

    const result = await query(
      `UPDATE site_settings SET ${setClause}, updated_at = now() RETURNING *`,
      values
    );
    return successResponse(res, result.rows[0], 'Settings updated');
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return successResponse(res, null, 'No file uploaded');
    const { url } = await uploadImage(req.file.path, 'portfolio/avatars');
    await query(`UPDATE site_settings SET owner_avatar_url = $1, updated_at = now()`, [url]);
    return successResponse(res, { avatar_url: url }, 'Avatar uploaded');
  } catch (err) {
    next(err);
  }
}
