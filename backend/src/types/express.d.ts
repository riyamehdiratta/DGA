import 'express-session';
import type { UserRole } from './index.js';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: UserRole };
    }
  }
}
