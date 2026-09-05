import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import { Pool } from 'pg';

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  secret: sessionSecret,
  name: 'dga.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // 'lax' works for a same-origin/combined deployment. Cross-origin
    // deployments (frontend and backend on different domains, e.g.
    // Vercel + Render) need 'none', which browsers only accept alongside
    // Secure — so COOKIE_SAMESITE=none requires COOKIE_SECURE=true too.
    sameSite: process.env.COOKIE_SAMESITE === 'none' ? 'none' : 'lax',
    // Off by default so login isn't silently broken before HTTPS is set up
    // on a VPS (a Secure cookie is dropped by the browser over plain HTTP).
    // Set COOKIE_SECURE=true once the deployment is behind TLS.
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
