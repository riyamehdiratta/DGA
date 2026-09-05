import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../types/errors.js';
import type { ApiErrorBody } from '../types/index.js';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    const body: ApiErrorBody = { error: err.message };
    if (err.details !== undefined) {
      body.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
