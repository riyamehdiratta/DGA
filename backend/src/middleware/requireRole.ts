import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../types/index.js';

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    next();
  };
}
