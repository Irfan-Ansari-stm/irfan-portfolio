import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool';
import { successResponse, createdResponse, errorResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

const tagSchema = z.object({
  name: z.string().min(1).max(50).toLowerCase(),
  label: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1A73E8'),
});

export async function getAllTags(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query('SELECT * FROM tags ORDER BY name ASC');
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createTag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = tagSchema.parse(req.body);
    const result = await query(
      `INSERT INTO tags (name, label, color) VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label, color = EXCLUDED.color
       RETURNING *`,
      [data.name, data.label, data.color]
    );
    return createdResponse(res, result.rows[0], 'Tag created');
  } catch (err) {
    next(err);
  }
}

export async function updateTag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = tagSchema.partial().parse(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) return successResponse(res, null, 'Nothing to update');

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...keys.map(k => (data as any)[k])];

    const result = await query(
      `UPDATE tags SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rowCount === 0) return errorResponse(res, 'Tag not found', 404);
    return successResponse(res, result.rows[0], 'Tag updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteTag(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM tags WHERE id = $1', [id]);
    if (result.rowCount === 0) return errorResponse(res, 'Tag not found', 404);
    return successResponse(res, null, 'Tag deleted');
  } catch (err) {
    next(err);
  }
}
