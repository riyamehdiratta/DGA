# Hosting the DTL DGA Analysis System (free tier)

This deploys the app to the internet using three free services:

| Piece | Service | Role |
|---|---|---|
| Database | [Neon](https://neon.tech) | Free serverless PostgreSQL |
| Backend (API) | [Render](https://render.com) | Free Docker web service |
| Frontend (SPA) | [Vercel](https://vercel.com) | Free static hosting + CDN |

The frontend and backend end up on different domains (e.g. `your-app.vercel.app` and `your-api.onrender.com`), so the app is already built to handle that split via a few environment variables — no further code changes needed. See `README.md` for the local-dev setup instead, if that's what you need.

## Before you start

- A GitHub (or GitLab) account with this repo pushed to it — both Render and Vercel deploy from a git repo, not a local folder.
- Free accounts on Neon, Render, and Vercel.

---

## 1. Database — Neon

1. Sign up at [neon.tech](https://neon.tech) and create a new project (any region close to where Render will run is fine).
2. Once created, open the project's **Connection Details** and copy the connection string. Use the **pooled** connection string if Neon offers both (works better with Prisma's connection handling).
3. It looks like:
   ```
   postgresql://<user>:<password>@<host>/<database>?sslmode=require
   ```
4. Keep this tab open — you'll paste this into Render's environment variables next. You don't need to run any SQL or create tables yourself; the backend does that automatically on first deploy (`prisma migrate deploy`, see step 2.5 below).

---

## 2. Backend — Render

### 2.1 Create the Web Service

1. In the Render dashboard: **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Root Directory**: `backend`
   - **Environment**: **Docker**
   - **Dockerfile Path**: `backend/Dockerfile` (Render usually auto-detects this once Root Directory is set)
   - **Instance Type**: Free

### 2.2 Set environment variables

In the service's **Environment** tab, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string from step 1 |
| `PORT` | `3001` |
| `SESSION_SECRET` | a random string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `TRUST_PROXY` | `1` |
| `CORS_ORIGIN` | your Vercel URL, e.g. `https://your-app.vercel.app` (you can add/update this after step 3, once you know the real URL) |

Leave `BACKUP_DIR` unset — it defaults to a folder inside the container, which is fine given backups are meant to be downloaded immediately, not stored long-term (see "Backups" below).

### 2.3 Deploy

Click **Create Web Service**. Render builds the Docker image and starts the container. First build takes a few minutes.

On startup the container runs:
```
npx prisma migrate deploy && node dist/server.js
```
`migrate deploy` applies the existing migration history (`backend/prisma/migrations/`) to the fresh Neon database automatically — you don't run any Prisma commands yourself.

### 2.4 Confirm it's up

Visit `https://<your-service>.onrender.com/health` — should return `{"status":"ok"}`.

> **Free tier note**: the service spins down after ~15 minutes without traffic. The next request after that takes ~30–50 seconds to cold-start. This is normal, not a bug.

### 2.5 Create the first Admin account

In the Render dashboard, open the service's **Shell** tab and run:
```
npm run user:create -- admin@example.com "a-strong-password" ADMIN
```
This is the only account created outside the app — every account after this is made from **Admin Panel → Users**.

---

## 3. Frontend — Vercel

1. In Vercel: **Add New** → **Project** → import the same GitHub repo.
2. Configure:
   - **Root Directory**: repo root (leave default, not `backend`)
   - **Framework Preset**: Vite (should auto-detect)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add an environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your Render service URL, e.g. `https://your-api.onrender.com` (no trailing slash) |

4. Deploy.
5. Once deployed, copy the actual Vercel URL (e.g. `https://your-app.vercel.app`) and go back to Render → Environment → set `CORS_ORIGIN` to that exact URL → save (Render redeploys automatically on env var change).

---

## 4. Try it

Open your Vercel URL, sign in with the Admin account from step 2.5. If login fails silently, it's almost always one of:

- `CORS_ORIGIN` on Render doesn't exactly match the Vercel URL (must include `https://`, no trailing slash).
- `VITE_API_URL` on Vercel is missing/wrong — check the Network tab in devtools, requests should go to `https://your-api.onrender.com/api/...`, not a relative `/api/...`.
- `COOKIE_SAMESITE` isn't set to `none` on Render, or `COOKIE_SECURE` isn't `true` — both are required together for the cross-origin login cookie to be accepted by the browser.

---

## Backups

**Admin Panel → Backup → Create & Download Backup** runs `pg_dump` on the Render container and downloads the `.sql` file to your browser immediately — that download *is* the backup, there's nothing further to configure. Render's free tier has no persistent disk, so don't rely on the "Available Backups" list surviving a restart; save the downloaded file wherever you keep backups (your own computer, cloud storage, etc.).

## Restoring a backup

There is deliberately no restore button in the app — see the code comment in `backend/src/services/backup.service.ts` for why (a compromised or misclicked admin session should never be able to wipe production data). To restore, run from any machine with `psql` installed:

```bash
psql "<your Neon connection string>" -f backup.sql
```

This is destructive — it replaces existing data with the backup's contents. Only run it when you actually mean to.

## Updating the app

Push to the branch each service is connected to — both Render and Vercel redeploy automatically on push. Any new Prisma migrations apply automatically on the next Render deploy (`migrate deploy` runs on every startup).

## Seed data

The 5 sample transformers / 10 samples / 8 analyses used in local dev (`npm run db:setup`) never reach Neon — the production startup command only runs `prisma migrate deploy` (schema only, no seed step). Never run `npm run db:seed`, `db:setup`, or `db:reset` against the Neon connection string once real data exists there — the seed script wipes all transformers/samples/analyses before inserting its sample rows (it does not touch user accounts).

## Local / same-origin hosting later

If you later want to run this on a single machine instead (e.g. one laptop, no internet split), the same codebase supports it without further code changes — just leave `CORS_ORIGIN`, `COOKIE_SAMESITE`, and `VITE_API_URL` unset, build the frontend, copy its `dist/` into `backend/dist/public`, and run the backend alone; it serves both the API and the built frontend from one port (see the `STATIC_DIR` check in `backend/src/app.ts`).
