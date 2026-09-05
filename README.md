# DTL DGA Analysis System

Full-stack application for dissolved gas analysis (DGA) of power transformers, based on IEEE C57.104-2019.

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- TailwindCSS 4
- React Router 7
- Recharts

**Backend**
- Node.js + Express 5
- TypeScript (NodeNext modules)
- PostgreSQL + Prisma ORM
- express-session (cookie auth) + bcryptjs
- ExcelJS (report/import-export), Multer (file upload)

## Project Layout

One repo, two apps:

- `src/` — frontend (Vite dev server on `:5173`, proxies `/api` to the backend)
- `backend/` — Express API + Prisma (`:3001`)

See `CLAUDE.md` for the full architecture notes (backend layering, the two analysis-pipeline implementations, path aliases, etc.) if you're developing here regularly.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL only — the app itself runs natively via `npm run dev`)

### 1. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
```

### 2. Start PostgreSQL

```bash
npm run db:up
```

Runs `postgres:16` in Docker on port `5433` (dev-only data, separate from the Docker production setup above).

### 3. Configure the backend

```bash
cd backend
cp .env.example .env   # if .env doesn't already exist
```

Fill in `backend/.env`:

```env
DATABASE_URL="postgresql://dga:dga_secret@127.0.0.1:5433/dga_analysis?schema=public"
PORT=3001
SESSION_SECRET=          # required — generate below
COOKIE_SECURE=false
TRUST_PROXY=0
BACKUP_DIR=              # optional, defaults to ./backups
```

Generate `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set up the database

From `backend/`:

```bash
npm run db:setup
```

Runs `prisma generate` + `db push` + seed:
- 5 transformers
- 10 DGA samples
- 8 analysis records with delta results

### 5. Create the first Admin account

```bash
cd backend
npx tsx scripts/create-user.ts admin@example.com "a-strong-password" ADMIN
```

### 6. Run the app

From the repo root:

```bash
npm run dev:all
```

Or separately:

```bash
npm run dev           # frontend only, :5173
npm run dev:backend   # backend only, :3001
```

Open [http://localhost:5173](http://localhost:5173) and sign in with the account from step 5.

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # PostgreSQL schema
│   └── seed.ts             # Database seed script
├── scripts/
│   └── create-user.ts      # Bootstraps the first Admin account
└── src/
    ├── routes/             # Express route definitions
    ├── controllers/        # HTTP request handlers (parse request, call service)
    ├── services/           # Business logic / orchestration
    ├── repositories/       # Prisma data access (only layer touching Prisma)
    ├── lib/analysis/       # Server-side analysis pipeline + IEEE lookup tables
    ├── middleware/         # Auth, roles, error handling, rate limiting
    ├── types/              # DTOs, mappers, errors
    ├── app.ts              # Express app factory
    └── server.ts           # Server entry point

src/
├── api/                    # Frontend API client layer
├── context/
│   └── AppProvider.tsx     # Loads app state from /api/bootstrap once, holds in memory
├── lib/
│   ├── analysis/           # Legacy client-side pipeline (used by one save-flow only)
│   └── selectors.ts        # Derived data queries (dashboard stats, trends, reports)
└── pages/
    ├── admin/               # Admin Panel pages
    └── ...                  # Dashboard, Transformers, Analysis, Reports, Learn, Login

docs/                        # Canonical specs for each analysis engine — read before
                              # touching engine logic (see CLAUDE.md)
scripts/
├── backup-db.ps1            # Manual/scheduled Postgres backup (prod deployment)
└── restore-db.ps1           # Restore from a backup (destructive, confirmation required)
```

## API Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Log in (rate-limited) |
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/logout` | Log out |

### Transformers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transformers` | List all transformers |
| GET | `/api/transformers/:id` | Get transformer by ID |
| POST | `/api/transformers` | Create transformer |
| PUT | `/api/transformers/:id` | Update transformer |
| DELETE | `/api/transformers/:id` | Delete transformer (cascades samples & analyses) |

### Samples

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transformers/:id/samples` | List samples for a transformer |
| POST | `/api/transformers/:id/samples` | Create sample |
| GET | `/api/samples` | List all samples |
| GET | `/api/samples/:id` | Get sample by ID |

### Analysis

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/transformers/:id/analyses/run` | Run the full engine pipeline on a sample and persist the result |
| POST | `/api/transformers/:id/analyses` | Persist a pre-computed analysis result (legacy client-pipeline flow) |
| GET | `/api/analyses` | List all analyses |
| GET | `/api/analysis/:id` | Get analysis by ID |
| GET | `/api/analysis/:id/export/xlsx` | Export analysis report as Excel |

### Other

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bootstrap` | Load transformers, samples, and analyses in one request |
| POST | `/api/learn/sandbox` | Run engines against ad-hoc gas values (Learn page's Gas Lab) |

### Admin (requires `ADMIN` role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET/POST | `/api/admin/users` | List / create users |
| PUT | `/api/admin/users/:id` | Update a user (role, disable, etc.) |
| POST | `/api/admin/users/:id/reset-password` | Reset a user's password |
| GET | `/api/admin/audit-logs` | Audit log of logins and data changes |
| GET/POST | `/api/admin/backups` | List / trigger a database backup |
| GET | `/api/admin/backups/:filename/download` | Download a backup file |
| GET/POST | `/api/admin/import-export/transformers/...` | Bulk import/export transformers (xlsx) |
| GET/POST | `/api/admin/import-export/samples/:transformerId/...` | Bulk import/export samples (xlsx) |
| GET | `/api/admin/import-export/analyses/export` | Export analyses (xlsx) |
| GET | `/api/admin/health` | System health check |

## Data Model

`Transformer` 1—N `DgaSample` 1—1 `AnalysisResult` 1—1 `DeltaResult` (see `backend/prisma/schema.prisma` for full fields, including the `User` and audit log tables backing auth).

Deleting a `Transformer` cascades to its samples and analyses.

## Analysis Pipeline

Ten engines run in sequence per IEEE C57.104-2019 (full spec: `docs/ANALYSIS_PIPELINE.md`):

```
Norm Profile → Delta → Rate → Status → Key Gas → Doernenburg Ratio →
Duval Triangle → Duval Pentagon 1 → Duval Pentagon 2 → Recommendation
```

- `backend/src/lib/analysis/` is the authoritative, server-side implementation, backing `POST /api/transformers/:id/analyses/run`. IEEE threshold tables live under `backend/src/lib/analysis/ieee/`.
- `src/lib/analysis/` is a legacy client-side pipeline still used by one save flow (creating an analysis from an already-saved sample); it is not where new engine work should go.

Business logic belongs in the backend — the frontend only renders results. See `CLAUDE.md` for the working rules on adding/modifying engines.

## Accounts & Roles

No public signup — every account is created by an Admin (or via `user:create` for the first one). Two roles:

- **Engineer** — day-to-day DGA workflow (transformers, samples, analyses, reports, Learn).
- **Admin** — everything an Engineer has, plus the Admin Panel (Dashboard, Users, Audit Logs, Backup, Import/Export, System Health).

## Routes (frontend)

| Route | Page |
|-------|------|
| `/login` | Login |
| `/` | Dashboard |
| `/transformers` | Transformer List |
| `/transformers/:id` | Transformer Detail |
| `/analysis/new` | New Analysis Wizard |
| `/analysis/history` | Analysis History |
| `/analysis/:id` | Analysis Result |
| `/reports` | Reports List |
| `/reports/:id` | Report Preview |
| `/learn` | Learn (concepts + live Gas Lab sandbox) |
| `/admin/*` | Admin Panel (Admin role only) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run dev:backend` | Start backend dev server |
| `npm run dev:all` | Start both, backgrounded |
| `npm run db:up` | Start PostgreSQL via Docker (dev) |
| `npm run db:setup` | Generate Prisma client, push schema, seed database |
| `npm run build` | Build frontend |
| `npm run build:backend` | Build backend |
| `npm test` | Run frontend tests (Vitest) |
| `cd backend && npm test` | Run backend tests (Vitest) |
| `cd backend && npm run db:migrate` | Create a Prisma migration |
| `cd backend && npm run db:reset` | Force-reset DB + reseed |
| `cd backend && npm run user:create` | Create a user (`email password ROLE`) |

## Testing

```bash
npm test                              # frontend, from repo root
npx vitest run path/to/file.test.ts   # single frontend test file
cd backend && npm test                # backend
```

## Notes

- Light mode, industrial/laboratory design aesthetic.
- Print support on the Reports page via the browser print dialog.
