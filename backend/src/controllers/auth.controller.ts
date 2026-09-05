import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { auditLogService } from '../services/auditLog.service.js';
import { UnauthorizedError } from '../types/errors.js';
import type { LoginInput, SignupInput } from '../types/index.js';

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;

    try {
      const user = await authService.login(email, password);
      req.session.userId = user.id;
      await auditLogService.record({
        userId: user.id,
        action: 'auth.login',
        targetType: 'User',
        targetId: user.id,
      });
      res.json(user);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        await auditLogService.record({
          userId: null,
          action: 'auth.login_failed',
          metadata: { email },
        });
      }
      throw err;
    }
  }

  async signup(req: Request, res: Response) {
    const user = await authService.signup(req.body as SignupInput);
    req.session.userId = user.id;
    await auditLogService.record({
      userId: user.id,
      action: 'auth.signup',
      targetType: 'User',
      targetId: user.id,
      metadata: { email: user.email, substationType: user.substationType, substationArea: user.substationArea },
    });
    res.status(201).json(user);
  }

  async logout(req: Request, res: Response) {
    const userId = req.user?.id ?? null;
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    res.clearCookie('dga.sid');
    if (userId) {
      await auditLogService.record({ userId, action: 'auth.logout', targetType: 'User', targetId: userId });
    }
    res.status(204).end();
  }

  async me(req: Request, res: Response) {
    const user = await authService.getUser(req.user!.id);
    res.json(user);
  }
}

export const authController = new AuthController();
