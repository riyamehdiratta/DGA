import type { Request, Response } from 'express';
import { paramId } from '../middleware/params.js';
import { auditLogService } from '../services/auditLog.service.js';
import { userService } from '../services/user.service.js';
import type { CreateUserInput, ResetPasswordInput, UpdateUserInput } from '../types/index.js';

export class UserController {
  async list(_req: Request, res: Response) {
    const users = await userService.listUsers();
    res.json(users);
  }

  async create(req: Request, res: Response) {
    const input = req.body as CreateUserInput;
    const user = await userService.createUser(input);
    await auditLogService.record({
      userId: req.user!.id,
      action: 'user.create',
      targetType: 'User',
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
    });
    res.status(201).json(user);
  }

  async update(req: Request, res: Response) {
    const id = paramId(req.params.id);
    const input = req.body as UpdateUserInput;
    const user = await userService.updateUser(id, input, req.user!.id);
    await auditLogService.record({
      userId: req.user!.id,
      action: 'user.update',
      targetType: 'User',
      targetId: id,
      metadata: input,
    });
    res.json(user);
  }

  async resetPassword(req: Request, res: Response) {
    const id = paramId(req.params.id);
    const { password } = req.body as ResetPasswordInput;
    const user = await userService.resetPassword(id, password);
    await auditLogService.record({
      userId: req.user!.id,
      action: 'user.password_reset',
      targetType: 'User',
      targetId: id,
    });
    res.json(user);
  }
}

export const userController = new UserController();
