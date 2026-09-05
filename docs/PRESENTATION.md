# DGA Analysis System — Presentation Notes

## 1. Elevator Pitch
- Purpose: Provide a robust, auditable system for detecting and analyzing domain generation algorithms (DGAs) used in network threats. The system centralizes submission, automated analysis, rule-based scoring, and human review with persistent, reproducible results.
- Audience outcomes: Understand the problem space, architecture, features implemented, technical choices, and how to run/demonstrate the system.

## 2. Problem Statement
- DGA-based malicious domains are used by malware to avoid static infrastructure. Security teams need tools to analyze domain lists, score suspicious activity, and record findings.
- Requirements: scalable batch analysis, reproducible rules/engine, user access, audit logging, and exportable results.

## 3. High-level Solution
- Web application with a TypeScript backend and React frontend.
- Backend exposes REST APIs to ingest domains, run analysis pipelines (pluggable transformers and rules), persist results in PostgreSQL via Prisma, and provide user/role management and audit logs.
- Frontend provides UI for submitting samples, viewing analysis history/results, managing transformers and rules, and exporting reports.

## 4. What's Implemented (Features)
- User auth and role-based access control (admins and users).
- Session-backed authentication; login rate limiting and structured error handling.
- Analysis pipelines with transformer modules and rule engines (several rule sets documented in /docs). See documentation files under `docs/` for specific rule definitions.
- Persistent storage of analyses, users, and audit logs in PostgreSQL via Prisma ORM; DB migrations and seed provided.
- File import/export of sample lists and results (CSV/Excel support via ExcelJS).
- Admin dashboard and tools to inspect past runs and audit actions.
- Health endpoint for quick service status checks.

## 5. Architecture and Component Breakdown
- Frontend (SPA): React 19 + Vite + TypeScript. Routing by `react-router-dom`, visualizations with `recharts`. TailwindCSS for styling.
- Backend: Node.js + TypeScript + Express 5 as the HTTP framework. Uses `express-session` and `connect-pg-simple` for session persistence on Postgres.
- Persistence: PostgreSQL, managed via Prisma (schema in `backend/prisma/schema.prisma`). Prisma handles migrations, client generation, and seed data.
- Analysis pipeline: modular transformers and rule sets implemented as services; results are persisted with metadata, timestamps, and engine versioning to guarantee reproducibility.
- File storage: assets copied into `dist/assets` at build time; file upload/processing handled by `multer`.
- Deployment helpers: Docker Compose included for local DB spin-up, and a Dockerfile for backend image.

Component interactions (data flow):
1. User submits domain list via frontend UI or API.
2. Backend enqueues or immediately runs the analysis pipeline: transformers (normalize, generate features) → rule engine (scoring rules) → result persistence.
3. Results stored in Postgres, indexed by analysis run id; audit logs record who ran what.
4. Frontend visualizes results and allows export.

## 6. Relevant Files and Where to Look
- Server bootstrap and app creation: [backend/src/app.ts](backend/src/app.ts)
- Entry point for backend server: [backend/src/server.ts](backend/src/server.ts)
- API controllers: [backend/src/controllers/](backend/src/controllers/)
- Prisma schema & migrations: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Frontend entry: [src/main.tsx](src/main.tsx)
- Frontend pages and components: [src/pages/](src/pages/) and [src/components/](src/components/)
- Rule & engine documentation: see `docs/` (e.g., `ANALYSIS_PIPELINE.md`, `RATE_ENGINE_RULES.md`, rule sets for Duval/IEEE, etc.)

## 7. Tech Stack (Concise)
- Frontend: React 19, TypeScript, Vite, TailwindCSS, Recharts, react-router-dom
- Backend: Node.js (ESM), TypeScript, Express 5, Prisma, PostgreSQL, tsx for dev
- Libraries: bcryptjs (passwords), express-session + connect-pg-simple (sessions), cors, multer, exceljs
- Dev/test: Vitest, TypeScript, ESLint, Tailwind plugin
- Deployment: Dockerfile (backend), docker-compose.yml to run DB and services

## 8. Security & Operational Notes
- Authentication: session-based via secure cookies; sessions stored in Postgres to survive restarts.
- Rate limiting: login attempts rate-limited to mitigate brute-force.
- CORS: only enabled when `CORS_ORIGIN` is configured to support separate-hosted frontends.
- Secrets: loaded from environment variables (`.env` in development). Ensure secure secret management in production.
- Health checks: `/health` endpoint for orchestration readiness/probes.

## 9. Persistence, Migrations & Seed
- Prisma is the ORM; migrations live under `backend/prisma/migrations`.
- Seed script: `backend/prisma/seed.ts` (registered in package.json). To generate client and seed DB:

```bash
# from repo root
npm run db:generate --prefix backend
npm run db:push --prefix backend
npm run db:seed --prefix backend
```

Or use the convenience script:

```bash
npm run db:setup
```

## 10. Running Locally (Dev/Quick Demo)
- Start the DB (docker-compose) and backend + frontend in dev mode:

```bash
# start a local DB
npm run db:up

# backend dev server
npm run dev:backend

# frontend dev server
npm run dev
```

- The backend dev server uses `tsx` for hot reloading: `backend/src/server.ts` boots the app.
- To build both for production:

```bash
npm run build:backend
npm run build
```

## 11. API Surface (Summary)
- Health: `GET /health` — basic status.
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — session-based auth flows.
- Analysis: `POST /api/analysis` to submit, `GET /api/analysis/:id` for results, `GET /api/analysis` for history.
- Admin: endpoints under `/api/admin` to manage transformers, users, and to view audit logs.

(Refer to `backend/src/controllers/*` for exact routes and request/response shapes.)

## 12. Tests & Quality
- Unit & integration tests use `vitest` — run `npm test` in repo root and in `backend`.
- Linting: ESLint configured; run `npm run lint`.

## 13. Observability & Logging
- Server logs are standard stdout; consider integrating structured logging (pino/winston) and request tracing for production.
- Audit logs persist user actions for compliance and review.

## 14. Limitations & Future Work
- Background processing: the analysis currently runs inline; for high volume, introduce job queue (BullMQ/Redis) and worker processes.
- Scaling sessions: consider Redis-backed sessions or JWTs for statelessness in distributed deployments.
- Advanced telemetry: integrate Prometheus/Grafana and tracing (OpenTelemetry).
- Rule management UX: add UI for live rule editing with audit-enabled versioning.

## 15. Suggested Slide Outline (for a 10–15 minute talk)
1. Title & goal (30s)
2. Problem: DGAs & analyst challenges (60s)
3. Solution overview (90s)
4. Architecture diagram and data flow (2 min)
5. Key features and demo screenshots (2 min)
6. Tech stack and choices (60s)
7. Security, persistence, and deployment (60s)
8. Demo plan / how to run locally (90s)
9. Roadmap & future work (60s)
10. Q&A (remaining time)

## 16. Speaker Notes / Demo Script
- Start with the problem: explain DGA churn and need for reproducible analysis.
- Open the app (or show screenshots). Walk through submitting a sample, explain transformers and rules, show result visualization and export.
- Show audit logs to emphasize reproducibility and accountability.
- Finish with how the stack supports both rapid development (Vite + tsx) and production deployment (Docker + Postgres + Prisma).

## 17. Helpful Commands for Demo
```bash
# start DB
npm run db:up

# seed DB
npm run db:setup

# start backend
npm run dev:backend

# start frontend
npm run dev
```

## 18. Appendix — Useful Links in Repo
- App bootstrap: [backend/src/app.ts](backend/src/app.ts)
- Backend server entry: [backend/src/server.ts](backend/src/server.ts)
- Prisma schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Docs with rule sets: [docs/](docs/)

---

If you want, I can also generate a slide deck (PowerPoint or Markdown-based slides) from this outline and include speaker notes and a few diagrams. Let me know which slide format you prefer.