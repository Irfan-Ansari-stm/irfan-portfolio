import { Response } from 'express';
import { ApiResponse, PaginatedResult } from '../types';

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(response);
}

export function createdResponse<T>(res: Response, data: T, message?: string): Response {
  return successResponse(res, data, message, 201);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 400,
  error?: string
): Response {
  const response: ApiResponse = { success: false, message, error };
  return res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: Response,
  result: PaginatedResult<T>,
  message?: string
): Response {
  return res.status(200).json({ success: true, ...result, message });
}

export function paginate<T>(
  rows: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function getPaginationParams(query: any): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
