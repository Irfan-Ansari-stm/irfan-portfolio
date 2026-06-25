import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool';
import { successResponse, createdResponse, errorResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

const EXP_TYPES = ['work', 'education', 'certification', 'achievement'] as const;

const experienceSchema = z.object({
  type: z.enum(EXP_TYPES).default('work'),
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  location: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_current: z.boolean().default(false),
  logo_url: z.string().url().optional().nullable(),
  display_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
});

export async function getExperiences(req: Request, res: Response, next: NextFunction) {
  try {
    const { type } = req.query;
    const visibleOnly = req.query.visible !== 'false';

    let whereConditions: string[] = [];
    const params: any[] = [];

    if (visibleOnly) whereConditions.push('is_visible = true');
    if (type) {
      params.push(type);
      whereConditions.push(`type = $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT * FROM experiences ${whereClause} ORDER BY display_order ASC, start_date DESC`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getExperienceById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query('SELECT * FROM experiences WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return errorResponse(res, 'Experience not found', 404);
    return successResponse(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function createExperience(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = experienceSchema.parse(req.body);
    const result = await query(
      `INSERT INTO experiences
        (type, title, organization, location, description, start_date, end_date, is_current, logo_url, display_order, is_visible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        data.type, data.title, data.organization, data.location, data.description,
        data.start_date, data.end_date, data.is_current, data.logo_url,
        data.display_order, data.is_visible,
      ]
    );
    return createdResponse(res, result.rows[0], 'Experience created');
  } catch (err) {
    next(err);
  }
}

export async function updateExperience(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = experienceSchema.partial().parse(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) return successResponse(res, null, 'Nothing to update');

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE experiences SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...keys.map(k => (data as any)[k])]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Experience not found', 404);
    return successResponse(res, result.rows[0], 'Experience updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteExperience(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query('DELETE FROM experiences WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return errorResponse(res, 'Experience not found', 404);
    return successResponse(res, null, 'Experience deleted');
  } catch (err) {
    next(err);
  }
}
