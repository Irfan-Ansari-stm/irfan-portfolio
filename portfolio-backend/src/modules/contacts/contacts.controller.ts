import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool';
import { successResponse, createdResponse, errorResponse } from '../../utils/response';
import { getPaginationParams, paginate, paginatedResponse } from '../../utils/response';
import { sendContactNotification } from '../../utils/email';
import { AuthenticatedRequest } from '../../types';

const STATUSES = ['unread', 'read', 'replied', 'archived'] as const;

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});

export async function submitContact(req: Request, res: Response, next: NextFunction) {
  try {
    const data = contactSchema.parse(req.body);
    const ip_address = req.ip;

    const result = await query(
      `INSERT INTO contacts (name, email, subject, message, ip_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.email, data.subject, data.message, ip_address]
    );

    // Get notify email from settings
    const settingsRes = await query(`SELECT notify_email, owner_email FROM site_settings LIMIT 1`);
    const settings = settingsRes.rows[0];
    const notifyEmail = settings?.notify_email || settings?.owner_email;

    if (notifyEmail) {
      sendContactNotification({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        notifyEmail,
      }).catch((err) => console.error('Email send failed:', err));
    }

    // Track analytics
    query(`INSERT INTO analytics_events (event_type, path, ip_address, user_agent)
           VALUES ('contact_form', '/contact', $1, $2)`,
      [ip_address, req.get('user-agent')]
    ).catch(() => {});

    return createdResponse(
      res,
      { id: result.rows[0].id },
      'Message sent successfully! I will get back to you soon.'
    );
  } catch (err) {
    next(err);
  }
}

export async function getContacts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, search } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(name ILIKE $${params.length} OR email ILIKE $${params.length} OR subject ILIKE $${params.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM contacts ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const dataRes = await query(
      `SELECT * FROM contacts ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return paginatedResponse(res, paginate(dataRes.rows, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getContactById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return errorResponse(res, 'Contact not found', 404);

    // Auto-mark as read
    if (result.rows[0].status === 'unread') {
      await query(`UPDATE contacts SET status = 'read' WHERE id = $1`, [req.params.id]);
      result.rows[0].status = 'read';
    }

    return successResponse(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateContactStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const schema = z.object({ status: z.enum(STATUSES) });
    const { status } = schema.parse(req.body);

    const result = await query(
      `UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rowCount === 0) return errorResponse(res, 'Contact not found', 404);
    return successResponse(res, result.rows[0], 'Status updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return errorResponse(res, 'Contact not found', 404);
    return successResponse(res, null, 'Contact deleted');
  } catch (err) {
    next(err);
  }
}

export async function getContactStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'unread')   AS unread,
        COUNT(*) FILTER (WHERE status = 'read')     AS read,
        COUNT(*) FILTER (WHERE status = 'replied')  AS replied,
        COUNT(*) FILTER (WHERE status = 'archived') AS archived,
        COUNT(*)                                    AS total,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') AS last_7_days
      FROM contacts
    `);
    return successResponse(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}
