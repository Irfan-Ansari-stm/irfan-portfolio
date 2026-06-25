import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../../db/pool';
import { env } from '../../config/env';
import { generateTokens, JwtPayload } from '../../middleware/auth';
import { successResponse, errorResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../types';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export async function setupAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = setupSchema.parse(req.body);

    // Allow only if no admin exists
    const existing = await query('SELECT id FROM admin_users LIMIT 1');
    if (existing.rowCount > 0) {
      return errorResponse(res, 'Admin already exists', 409);
    }

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const result = await query(
      `INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name`,
      [email, password_hash, name]
    );

    return successResponse(res, result.rows[0], 'Admin created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query<any>('SELECT * FROM admin_users WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    // Store refresh token (hashed)
    const hashedRefresh = await bcrypt.hash(refreshToken, 6);
    await query(
      `UPDATE admin_users SET refresh_token = $1, last_login_at = now() WHERE id = $2`,
      [hashedRefresh, admin.id]
    );

    return successResponse(res, {
      accessToken,
      refreshToken,
      admin: { id: admin.id, email: admin.email, name: admin.name, avatar_url: admin.avatar_url },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return errorResponse(res, 'Refresh token required', 400);

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const result = await query<any>('SELECT * FROM admin_users WHERE id = $1', [payload.id]);
    const admin = result.rows[0];
    if (!admin || !admin.refresh_token) return errorResponse(res, 'Session invalidated', 401);

    const isValid = await bcrypt.compare(token, admin.refresh_token);
    if (!isValid) return errorResponse(res, 'Invalid refresh token', 401);

    const tokens = generateTokens({ id: admin.id, email: admin.email, name: admin.name });

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 6);
    await query('UPDATE admin_users SET refresh_token = $1 WHERE id = $2', [hashedRefresh, admin.id]);

    return successResponse(res, tokens, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await query('UPDATE admin_users SET refresh_token = NULL WHERE id = $1', [req.admin!.id]);
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await query<any>(
      'SELECT id, email, name, avatar_url, last_login_at, created_at FROM admin_users WHERE id = $1',
      [req.admin!.id]
    );
    return successResponse(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const result = await query<any>('SELECT password_hash FROM admin_users WHERE id = $1', [req.admin!.id]);
    const admin = result.rows[0];

    const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValid) return errorResponse(res, 'Current password is incorrect', 400);

    const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, req.admin!.id]);

    return successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
}
