# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DTL DGA Analysis System — a full-stack app for dissolved gas analysis (DGA) of power transformers, based on IEEE C57.104-2019. React/Vite frontend + Express/Prisma/PostgreSQL backend, in one repo (`src/` = frontend, `backend/` = backend).

## Commands

Run from repo root unless noted.

```bash
npm run db:up          # start PostgreSQL via Docker (postgres:16, port 5433)
npm run db:setup       # backend: prisma generate + db push + seed (5 transformers, 10 samples, 8 analyses)
npm run dev             # frontend dev server (Vite, :5173, proxies /api -> :3001)
npm run dev:backend     # backend dev server (tsx watch, :3001)
npm run dev:all         # both, backgrounded

npm run build            # frontend: tsc -b && vite build
npm run build:backend    # backend: tsc

npm test                            # frontend vitest run (src/**/*.test.ts)
npx vitest run path/to/file.test.ts # single frontend test file
cd backend && npm test              # backend vitest run (src/**/*.test.ts)
```

Backend-only, from `backend/`:

```bash
npm run db:generate   # prisma generate
npm run db:push       # prisma db push (schema -> DB, no migration file)
npm run db:migrate    # prisma migrate dev
npm run db:reset       # force-reset db + reseed
```

Backend needs `backend/.env` (copy from `backend/.env.example`) with `DATABASE_URL` and `PORT`.

There's a root `lint` script (`eslint .`) in package.json but no eslint config currently exists at the repo root — don't assume it runs cleanly.

## Architecture

### Two codebases, one repo

- `src/` — React 19 + TypeScript + Vite + TailwindCSS 4 + React Router 7 + Recharts frontend.
- `backend/` — Node + Express 5 + Prisma + PostgreSQL API, TypeScript with `NodeNext` modules (relative imports need explicit `.js` extensions even though source is `.ts`).

Path alias `@/*` → `src/*` on the frontend (configured in both `tsconfig.app.json` and `vite.config.ts`); the backend has no path alias, only relative imports.

### Backend layering

Strict one-directional flow: `routes` → `controllers` → `services` → `repositories` → Prisma. Controllers only parse the request and call a service; services hold business rules and orchestrate repositories; repositories are the only layer that touches `prisma`. DTOs and Prisma→DTO mappers live in `backend/src/types/` (`mappers.ts`). Follow `backend/src/{controllers,services,repositories}/analysis.*.ts` as the reference implementation for this pattern when adding a new resource.

### The analysis pipeline exists in two places — know which one is authoritative

`docs/ANALYSIS_PIPELINE.md` defines the canonical 10-engine pipeline (Norm Profile → Delta → Rate → Status → Key Gas → Doernenburg → Duval Triangle → Duval Pentagon 1 → Duval Pentagon 2 → Recommendation) and states the target architecture explicitly: **business logic belongs in the backend; the frontend only renders results.** IEEE threshold values must never be hardcoded — `docs/IEEE_TABLES.md` is the single source of truth for them.

Currently there are two parallel, partially-diverged implementations of these engines:

- `src/lib/analysis/` — the original client-side pipeline (`runAnalysis.ts`). Still used by parts of the UI (e.g. the "create analysis from already-saved sample" flow) and computes Norm Profile, Delta, Status, Key Gas, Rogers, Duval Triangle, Duval Pentagon in-browser.
- `backend/src/lib/analysis/` — the newer server-side pipeline (`runAnalysisPipeline` in `runAnalysis.ts`), backing `POST /api/transformers/:id/analyses/run`. It currently implements Norm Profile, Delta, and Status, with IEEE lookup tables under `backend/src/lib/analysis/ieee/` (`tables.ts` holds the raw table data, `lookup.ts` the threshold-lookup functions). This is where new engines (Rate, Key Gas, Doernenburg, Duval Triangle/Pentagon, Recommendation) should be added going forward, per the docs' "business logic belongs in the backend" rule — not in `src/lib/analysis/`.

When implementing a new engine from one of the `docs/*_RULES.md` files, add it to `backend/src/lib/analysis/`, wire it into `runAnalysisPipeline`, and extend the pipeline context/result types in `backend/src/lib/analysis/types.ts` — don't hand-roll thresholds inline; add them to `ieee/tables.ts` and look them up via `ieee/lookup.ts`.

### Rules docs (`docs/`)

Each analysis engine's behavior is specified in its own markdown file before/alongside implementation — read the relevant one before touching an engine:

- `ANALYSIS_PIPELINE.md` — overall pipeline order, engine I/O, dependency graph.
- `IEEE_TABLES.md` / `IEEE_STATUS_LOGIC.md` — IEEE C57.104 threshold tables and status derivation logic.
- `RATE_ENGINE_RULES.md`, `KEY_GAS_RULES.md`, `DOERNENBURG_RATIO_RULES.md`, `DUVAL_TRIANGLE_RULES.md`, `DUVAL_PENTAGON_1_RULES.md`, `DUVAL_PENTAGON_2_RULES.md` — per-engine diagnostic rules.

### Frontend data flow

`src/context/AppProvider.tsx` loads all app state (`transformers`, `samples`, `analyses`) once from `GET /api/bootstrap` on mount and holds it in memory; mutations go through `src/api/*` and then patch local state rather than refetching. `src/lib/selectors.ts` derives everything screens need (dashboard stats, trends, report sections, history rows) from that in-memory `AppState` — pages/components should read through selectors and `useAppState()`, not query state directly. There is no client-side router-level data fetching; all data enters through the provider.

### Data model

`Transformer` 1—N `DgaSample` 1—1 `AnalysisResult` 1—1 `DeltaResult` (see `backend/prisma/schema.prisma`). Deleting a `Transformer` cascades to its samples and analyses.

## Working Rules

The `docs/` directory is the canonical specification for all DGA analysis engines.

When implementing or modifying an engine:

1. Read the corresponding `docs/*.md` file first.
2. Treat the documentation as the source of truth. If existing code conflicts with the documentation, assume the documentation is correct unless explicitly instructed otherwise.
3. Never hardcode IEEE threshold values or business rules. Use the shared IEEE lookup layer (`backend/src/lib/analysis/ieee/`).
4. Implement new analysis engines only in `backend/src/lib/analysis/` and integrate them into `runAnalysisPipeline`. Do not add new business logic to the frontend.
5. Reuse existing types, utilities, and architecture. Avoid duplicate implementations.
6. Keep implementations simple, deterministic, and consistent with the existing codebase. Do not introduce unnecessary abstractions, frameworks, or refactors.
7. Add or update unit tests for every engine change, including boundary conditions and IEEE examples where applicable.
8. If a requested change requires modifying the architecture, explain why before making the change.

The goal is to implement the IEEE specification faithfully while preserving the existing project architecture.
