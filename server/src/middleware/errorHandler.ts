import { Request, Response, NextFunction } from 'express';
import { SsrfError } from '../utils/ssrf';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
  if (isDev) {
    console.error('[ErrorHandler] Error caught:', err);
  }

  // SSRF or security validation errors
  if (err instanceof SsrfError || err.name === 'SsrfError') {
    res.status(400).json({
      status: 'error',
      code: 'SSRF_BLOCKED',
      message: err.message,
    });
    return;
  }

  // Rate limit errors from GitHub
  if (err.message && err.message.includes('rate limit exceeded')) {
    res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: err.message,
    });
    return;
  }

  // Not found errors
  if (err.status === 404 || (err.message && err.message.toLowerCase().includes('not found'))) {
    res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: err.message,
    });
    return;
  }

  // Default internal server error
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  res.status(statusCode).json({
    status: 'error',
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected internal error occurred',
  });
}
