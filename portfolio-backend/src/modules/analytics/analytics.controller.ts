import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool';
import { successResponse } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

const EVENT_TYPES = [
  'page_view',
  'project_click',
  'blog_view',
  'contact_form',
  'resume_download',
  'social_click',
] as const;

const trackSchema = z.object({
  event_type: z.enum(EVENT_TYPES),
  path: z.string().optional(),
  ref_id: z.string().optional(),
});

export async function trackEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = trackSchema.parse(req.body);
    await query(
      `INSERT INTO analytics_events (event_type, path, ref_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.event_type, data.path, data.ref_id, req.ip, req.get('user-agent')]
    );
    return successResponse(res, null, 'Event tracked');
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const [eventsRes, contactRes, projectRes, postRes] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'page_view')         AS page_views,
          COUNT(*) FILTER (WHERE event_type = 'project_click')     AS project_clicks,
          COUNT(*) FILTER (WHERE event_type = 'blog_view')         AS blog_views,
          COUNT(*) FILTER (WHERE event_type = 'contact_form')      AS contact_submissions,
          COUNT(*) FILTER (WHERE event_type = 'resume_download')   AS resume_downloads,
          COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS last_24h,
          COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')   AS last_7_days,
          COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')  AS last_30_days
        FROM analytics_events
      `),
      query(`SELECT COUNT(*) FILTER (WHERE status = 'unread') AS unread FROM contacts`),
      query(`SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL AND status = 'published'`),
      query(`SELECT COUNT(*) FROM blog_posts WHERE deleted_at IS NULL AND status = 'published'`),
    ]);

    return successResponse(res, {
      events: eventsRes.rows[0],
      unread_contacts: parseInt(contactRes.rows[0].unread, 10),
      published_projects: parseInt(projectRes.rows[0].count, 10),
      published_posts: parseInt(postRes.rows[0].count, 10),
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventTimeline(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const days = Math.min(90, parseInt((req.query.days as string) || '30', 10));

    const result = await query(`
      SELECT
        date_trunc('day', created_at)::date AS date,
        event_type,
        COUNT(*) AS count
      FROM analytics_events
      WHERE created_at >= now() - ($1 || ' days')::interval
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2
    `, [days]);

    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getTopPages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(50, parseInt((req.query.limit as string) || '10', 10));

    const result = await query(`
      SELECT
        path,
        COUNT(*) AS views,
        COUNT(DISTINCT ip_address) AS unique_visitors
      FROM analytics_events
      WHERE event_type = 'page_view' AND path IS NOT NULL
        AND created_at >= now() - interval '30 days'
      GROUP BY path
      ORDER BY views DESC
      LIMIT $1
    `, [limit]);

    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getTopProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query(`
      SELECT
        ae.ref_id AS project_id,
        p.title,
        p.slug,
        COUNT(*) AS clicks
      FROM analytics_events ae
      JOIN projects p ON p.id::text = ae.ref_id
      WHERE ae.event_type = 'project_click'
        AND ae.created_at >= now() - interval '30 days'
      GROUP BY ae.ref_id, p.title, p.slug
      ORDER BY clicks DESC
      LIMIT 10
    `);

    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
}
