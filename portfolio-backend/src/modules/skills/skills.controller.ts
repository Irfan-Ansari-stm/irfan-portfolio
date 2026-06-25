import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool';
import { successResponse, createdResponse, errorResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

const categorySchema = z.object({
  name: z.string().min(1).max(80),
  display_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
});

const skillSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  icon_url: z.string().url().optional(),
  level: z.enum(LEVELS).default('intermediate'),
  display_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
});

export async function getSkills(req: Request, res: Response, next: NextFunction) {
  try {
    const visibleOnly = req.query.visible !== 'false';
    const visClause = visibleOnly
      ? 'WHERE sc.is_visible = true AND s.is_visible = true'
      : '';

    const result = await query(`
      SELECT
        sc.id   AS category_id,
        sc.name AS category_name,
        sc.display_order AS category_order,
        json_agg(
          json_build_object(
            'id', s.id, 'name', s.name, 'icon_url', s.icon_url,
            'level', s.level, 'display_order', s.display_order, 'is_visible', s.is_visible
          ) ORDER BY s.display_order
        ) FILTER (WHERE s.id IS NOT NULL) AS skills
      FROM skill_categories sc
      LEFT JOIN skills s ON s.category_id = sc.id
      ${visClause}
      GROUP BY sc.id
      ORDER BY sc.display_order ASC
    `);
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query('SELECT * FROM skill_categories ORDER BY display_order ASC');
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = categorySchema.parse(req.body);
    const result = await query(
      `INSERT INTO skill_categories (name, display_order, is_visible) VALUES ($1, $2, $3) RETURNING *`,
      [data.name, data.display_order, data.is_visible]
    );
    return createdResponse(res, result.rows[0], 'Category created');
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = categorySchema.partial().parse(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) return successResponse(res, null, 'Nothing to update');

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE skill_categories SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...keys.map(k => (data as any)[k])]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Category not found', 404);
    return successResponse(res, result.rows[0], 'Category updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM skill_categories WHERE id = $1', [id]);
    if (result.rowCount === 0) return errorResponse(res, 'Category not found', 404);
    return successResponse(res, null, 'Category deleted');
  } catch (err) {
    next(err);
  }
}

export async function createSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = skillSchema.parse(req.body);
    const result = await query(
      `INSERT INTO skills (category_id, name, icon_url, level, display_order, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.category_id, data.name, data.icon_url, data.level, data.display_order, data.is_visible]
    );
    return createdResponse(res, result.rows[0], 'Skill created');
  } catch (err) {
    next(err);
  }
}

export async function updateSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = skillSchema.partial().parse(req.body);
    const keys = Object.keys(data);
    if (keys.length === 0) return successResponse(res, null, 'Nothing to update');

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE skills SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...keys.map(k => (data as any)[k])]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Skill not found', 404);
    return successResponse(res, result.rows[0], 'Skill updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM skills WHERE id = $1', [id]);
    if (result.rowCount === 0) return errorResponse(res, 'Skill not found', 404);
    return successResponse(res, null, 'Skill deleted');
  } catch (err) {
    next(err);
  }
}

export async function reorderSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ ids: z.array(z.string().uuid()) });
    const { ids } = schema.parse(req.body);
    for (let i = 0; i < ids.length; i++) {
      await query('UPDATE skill_categories SET display_order = $1 WHERE id = $2', [i, ids[i]]);
    }
    return successResponse(res, null, 'Categories reordered');
  } catch (err) {
    next(err);
  }
}
