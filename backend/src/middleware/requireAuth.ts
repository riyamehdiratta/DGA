import type { NextFunction, Request, Response } from 'express';
import { userRepository } from '../repositories/user.repository.js';
import type { UserRole } from '../types/index.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Looked up fresh on every request (rather than trusting the session)
  // so a disabled account loses access immediately, not just after its
  // session expires.
  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  req.user = { id: user.id, email: user.email, role: user.role as UserRole };
  next();
}
