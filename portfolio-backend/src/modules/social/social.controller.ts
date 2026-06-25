import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool';
import { successResponse, createdResponse, errorResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

const PLATFORMS = ['github', 'linkedin', 'twitter', 'instagram', 'youtube', 'website', 'other'] as const;

const createSchema = z.object({
  platform: z.enum(PLATFORMS),
  url: z.string().url(),
  label: z.string().optional(),
  display_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

export async function getSocialLinks(req: Request, res: Response, next: NextFunction) {
  try {
    const visibleOnly = req.query.visible !== 'false';
    const whereClause = visibleOnly ? 'WHERE is_visible = true' : '';
    const result = await query(
      `SELECT * FROM social_links ${whereClause} ORDER BY display_order ASC`
    );
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createSocialLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const result = await query(
      `INSERT INTO social_links (platform, url, label, display_order, is_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.platform, data.url, data.label, data.display_order, data.is_visible]
    );
    return createdResponse(res, result.rows[0], 'Social link created');
  } catch (err) {
    next(err);
  }
}

export async function updateSocialLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) return successResponse(res, null, 'Nothing to update');

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...keys.map(k => (data as any)[k])];

    const result = await query(
      `UPDATE social_links SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rowCount === 0) return errorResponse(res, 'Social link not found', 404);
    return successResponse(res, result.rows[0], 'Social link updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteSocialLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM social_links WHERE id = $1', [id]);
    if (result.rowCount === 0) return errorResponse(res, 'Social link not found', 404);
    return successResponse(res, null, 'Social link deleted');
  } catch (err) {
    next(err);
  }
}

export async function reorderSocialLinks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ ids: z.array(z.string().uuid()) });
    const { ids } = schema.parse(req.body);

    for (let i = 0; i < ids.length; i++) {
      await query('UPDATE social_links SET display_order = $1 WHERE id = $2', [i, ids[i]]);
    }
    return successResponse(res, null, 'Social links reordered');
  } catch (err) {
    next(err);
  }
}
