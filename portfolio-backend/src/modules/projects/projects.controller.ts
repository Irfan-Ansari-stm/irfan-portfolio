import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../../db/pool';
import { successResponse, createdResponse, errorResponse } from '../../utils/response';
import { getPaginationParams, paginate, paginatedResponse } from '../../utils/response';
import { generateSlug } from '../../utils/slug';
import { uploadImage } from '../../utils/cloudinary';
import { AuthenticatedRequest } from '../../types';

const STATUSES = ['draft', 'published', 'archived'] as const;

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
  short_desc: z.string().min(1).max(300),
  long_desc: z.string().optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  github_url: z.string().url().optional().nullable(),
  demo_url: z.string().url().optional().nullable(),
  status: z.enum(STATUSES).default('published'),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().default(0),
  tag_ids: z.array(z.string().uuid()).optional(),
});

const screenshotSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().optional(),
  display_order: z.number().int().default(0),
});

async function attachTagsAndScreenshots(projectId: string) {
  const [tagsRes, screenshotsRes] = await Promise.all([
    query(`
      SELECT t.* FROM tags t
      JOIN project_tags pt ON pt.tag_id = t.id
      WHERE pt.project_id = $1 ORDER BY t.name
    `, [projectId]),
    query(`
      SELECT * FROM project_screenshots WHERE project_id = $1 ORDER BY display_order
    `, [projectId]),
  ]);
  return { tags: tagsRes.rows, screenshots: screenshotsRes.rows };
}

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, tag, featured, search } = req.query;

    const conditions: string[] = ['p.deleted_at IS NULL'];
    const params: any[] = [];

    // Public: only published unless admin
    if (!status) {
      conditions.push(`p.status = 'published'`);
    } else {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    if (featured === 'true') conditions.push('p.is_featured = true');

    if (tag) {
      params.push(tag);
      conditions.push(`EXISTS (
        SELECT 1 FROM project_tags pt2
        JOIN tags t2 ON t2.id = pt2.tag_id
        WHERE pt2.project_id = p.id AND (t2.name = $${params.length} OR t2.id::text = $${params.length})
      )`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.title ILIKE $${params.length} OR p.short_desc ILIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query(
      `SELECT COUNT(*) FROM projects p ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const dataRes = await query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            json_build_object('id',t.id,'name',t.name,'label',t.label,'color',t.color)
            ORDER BY t.name
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM projects p
      LEFT JOIN project_tags pt ON pt.project_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.is_featured DESC, p.display_order ASC, p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return paginatedResponse(res, paginate(dataRes.rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getFeaturedProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            json_build_object('id',t.id,'name',t.name,'label',t.label,'color',t.color)
            ORDER BY t.name
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM projects p
      LEFT JOIN project_tags pt ON pt.project_id = p.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      WHERE p.is_featured = true AND p.status = 'published' AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY p.display_order ASC
      LIMIT 3
    `);
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getProjectBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const result = await query(
      `SELECT * FROM projects WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Project not found', 404);
    const project = result.rows[0];
    const { tags, screenshots } = await attachTagsAndScreenshots(project.id);

    // Track analytics
    query(`INSERT INTO analytics_events (event_type, path, ref_id, ip_address, user_agent)
           VALUES ('project_click', $1, $2, $3, $4)`,
      [`/projects/${slug}`, project.id, req.ip, req.get('user-agent') as string]
    ).catch(() => {});

    return successResponse(res, { ...project, tags, screenshots });
  } catch (err) {
    next(err);
  }
}

export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Project not found', 404);
    const project = result.rows[0];
    const { tags, screenshots } = await attachTagsAndScreenshots(project.id);
    return successResponse(res, { ...project, tags, screenshots });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = projectSchema.parse(req.body);
    const slug = data.slug || generateSlug(data.title);

    const project = await withTransaction(async (client) => {
      const r = await client.query(
        `INSERT INTO projects
          (title, slug, short_desc, long_desc, thumbnail_url, github_url, demo_url, status, is_featured, display_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          data.title, slug, data.short_desc, data.long_desc, data.thumbnail_url,
          data.github_url, data.demo_url, data.status, data.is_featured, data.display_order,
        ]
      );
      const proj = r.rows[0];

      if (data.tag_ids?.length) {
        for (const tag_id of data.tag_ids) {
          await client.query(
            'INSERT INTO project_tags (project_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [proj.id, tag_id]
          );
        }
      }
      return proj;
    });

    const { tags, screenshots } = await attachTagsAndScreenshots(project.id);
    return createdResponse(res, { ...project, tags, screenshots }, 'Project created');
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = projectSchema.partial().parse(req.body);
    const { tag_ids, ...fields } = data;

    const updated = await withTransaction(async (client) => {
      // Update fields
      const keys = Object.keys(fields);
      if (keys.length > 0) {
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const r = await client.query(
          `UPDATE projects SET ${setClause}, updated_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
          [id, ...keys.map(k => (fields as any)[k])]
        );
        if (r.rowCount === 0) throw new Error('NOT_FOUND');
      }

      // Sync tags
      if (tag_ids !== undefined) {
        await client.query('DELETE FROM project_tags WHERE project_id = $1', [id]);
        for (const tag_id of tag_ids) {
          await client.query(
            'INSERT INTO project_tags (project_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, tag_id]
          );
        }
      }

      const r2 = await client.query('SELECT * FROM projects WHERE id = $1', [id]);
      return r2.rows[0];
    });

    const { tags, screenshots } = await attachTagsAndScreenshots(id);
    return successResponse(res, { ...updated, tags, screenshots }, 'Project updated');
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return errorResponse(res, 'Project not found', 404);
    next(err);
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `UPDATE projects SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Project not found', 404);
    return successResponse(res, null, 'Project deleted');
  } catch (err) {
    next(err);
  }
}

export async function addScreenshot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = screenshotSchema.parse(req.body);
    const result = await query(
      `INSERT INTO project_screenshots (project_id, url, alt_text, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, data.url, data.alt_text, data.display_order]
    );
    return createdResponse(res, result.rows[0], 'Screenshot added');
  } catch (err) {
    next(err);
  }
}

export async function deleteScreenshot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id, screenshotId } = req.params;
    const result = await query(
      'DELETE FROM project_screenshots WHERE id = $1 AND project_id = $2',
      [screenshotId, id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Screenshot not found', 404);
    return successResponse(res, null, 'Screenshot deleted');
  } catch (err) {
    next(err);
  }
}

export async function reorderScreenshots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ ids: z.array(z.string().uuid()) });
    const { ids } = schema.parse(req.body);
    for (let i = 0; i < ids.length; i++) {
      await query(
        'UPDATE project_screenshots SET display_order = $1 WHERE id = $2 AND project_id = $3',
        [i, ids[i], req.params.id]
      );
    }
    return successResponse(res, null, 'Screenshots reordered');
  } catch (err) {
    next(err);
  }
}

export async function uploadThumbnail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);
    const { url } = await uploadImage(req.file.path, 'portfolio/projects');
    const result = await query(
      'UPDATE projects SET thumbnail_url = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [url, req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Project not found', 404);
    return successResponse(res, { thumbnail_url: url }, 'Thumbnail uploaded');
  } catch (err) {
    next(err);
  }
}
