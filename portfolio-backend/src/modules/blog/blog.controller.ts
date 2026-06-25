import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../../db/pool';
import { successResponse, createdResponse, errorResponse } from '../../utils/response';
import { getPaginationParams, paginate, paginatedResponse } from '../../utils/response';
import { generateSlug, estimateReadingTime } from '../../utils/slug';
import { uploadImage } from '../../utils/cloudinary';
import { AuthenticatedRequest } from '../../types';

const STATUSES = ['draft', 'published', 'archived'] as const;

const postSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().optional(),
  excerpt: z.string().min(1).max(500),
  content: z.string().default(''),
  cover_image_url: z.string().url().optional().nullable(),
  reading_time_mins: z.number().int().min(1).optional(),
  status: z.enum(STATUSES).default('draft'),
  tag_ids: z.array(z.string().uuid()).optional(),
});

async function attachTags(postId: string) {
  const result = await query(`
    SELECT t.* FROM tags t
    JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = $1 ORDER BY t.name
  `, [postId]);
  return result.rows;
}

export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { tag, search } = req.query;
    const isAdmin = (req as AuthenticatedRequest).admin !== undefined;

    const conditions: string[] = ['bp.deleted_at IS NULL'];
    const params: any[] = [];

    if (!isAdmin) {
      conditions.push(`bp.status = 'published'`);
    } else if (req.query.status) {
      params.push(req.query.status);
      conditions.push(`bp.status = $${params.length}`);
    }

    if (tag) {
      params.push(tag);
      conditions.push(`EXISTS (
        SELECT 1 FROM post_tags pt2
        JOIN tags t2 ON t2.id = pt2.tag_id
        WHERE pt2.post_id = bp.id AND (t2.name = $${params.length} OR t2.id::text = $${params.length})
      )`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(bp.title ILIKE $${params.length} OR bp.excerpt ILIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query(`SELECT COUNT(*) FROM blog_posts bp ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const dataRes = await query(`
      SELECT
        bp.*,
        COALESCE(
          json_agg(
            json_build_object('id',t.id,'name',t.name,'label',t.label,'color',t.color)
            ORDER BY t.name
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM blog_posts bp
      LEFT JOIN post_tags pt ON pt.post_id = bp.id
      LEFT JOIN tags t ON t.id = pt.tag_id
      ${whereClause}
      GROUP BY bp.id
      ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return paginatedResponse(res, paginate(dataRes.rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getPostBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT * FROM blog_posts WHERE slug = $1 AND deleted_at IS NULL`,
      [req.params.slug]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Post not found', 404);
    const post = result.rows[0];
    const tags = await attachTags(post.id);

    // Track page view
    query(`INSERT INTO analytics_events (event_type, path, ref_id, ip_address, user_agent)
           VALUES ('page_view', $1, $2, $3, $4)`,
      [`/blog/${post.slug}`, post.id, req.ip, req.get('user-agent') as string]
    ).catch(() => {});

    return successResponse(res, { ...post, tags });
  } catch (err) {
    next(err);
  }
}

export async function getPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT * FROM blog_posts WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Post not found', 404);
    const post = result.rows[0];
    const tags = await attachTags(post.id);
    return successResponse(res, { ...post, tags });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = postSchema.parse(req.body);
    const slug = data.slug || generateSlug(data.title);
    const reading_time = data.reading_time_mins || estimateReadingTime(data.content);

    const post = await withTransaction(async (client) => {
      const r = await client.query(
        `INSERT INTO blog_posts
          (title, slug, excerpt, content, cover_image_url, reading_time_mins, status, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          data.title, slug, data.excerpt, data.content, data.cover_image_url,
          reading_time, data.status,
          data.status === 'published' ? new Date() : null,
        ]
      );
      const p = r.rows[0];
      if (data.tag_ids?.length) {
        for (const tag_id of data.tag_ids) {
          await client.query(
            'INSERT INTO post_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [p.id, tag_id]
          );
        }
      }
      return p;
    });

    const tags = await attachTags(post.id);
    return createdResponse(res, { ...post, tags }, 'Post created');
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = postSchema.partial().parse(req.body);
    const { tag_ids, ...fields } = data;

    if (fields.content && !fields.reading_time_mins) {
      fields.reading_time_mins = estimateReadingTime(fields.content);
    }

    const updated = await withTransaction(async (client) => {
      const keys = Object.keys(fields);
      if (keys.length > 0) {
        // Handle publish timestamp auto-set
        const extraSet = fields.status === 'published'
          ? `, published_at = COALESCE(published_at, now())`
          : '';
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const r = await client.query(
          `UPDATE blog_posts SET ${setClause}${extraSet}, updated_at = now()
           WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
          [id, ...keys.map(k => (fields as any)[k])]
        );
        if (r.rowCount === 0) throw new Error('NOT_FOUND');
      }

      if (tag_ids !== undefined) {
        await client.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
        for (const tag_id of tag_ids) {
          await client.query(
            'INSERT INTO post_tags (post_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [id, tag_id]
          );
        }
      }

      return (await client.query('SELECT * FROM blog_posts WHERE id = $1', [id])).rows[0];
    });

    const tags = await attachTags(id);
    return successResponse(res, { ...updated, tags }, 'Post updated');
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return errorResponse(res, 'Post not found', 404);
    next(err);
  }
}

export async function deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `UPDATE blog_posts SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Post not found', 404);
    return successResponse(res, null, 'Post deleted');
  } catch (err) {
    next(err);
  }
}

export async function publishPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `UPDATE blog_posts SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Post not found', 404);
    return successResponse(res, result.rows[0], 'Post published');
  } catch (err) {
    next(err);
  }
}

export async function uploadCoverImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);
    const { url } = await uploadImage(req.file.path, 'portfolio/blog');
    const result = await query(
      'UPDATE blog_posts SET cover_image_url = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [url, req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Post not found', 404);
    return successResponse(res, { cover_image_url: url }, 'Cover image uploaded');
  } catch (err) {
    next(err);
  }
}
