# Open Items

Snapshot of what's left in the app, as of 2026-07-10. Grouped by what kind of work it is, not by priority — pick from whichever bucket matches what you want to work on next.

---

## Pending decisions

- **Duval fault-zone vs. Status contradiction in reports.** The redesigned report (and the app in general) can show `DGA Status: Status 1 (Normal)` next to `Fault Diagnosis: T3 — Thermal fault > 700 °C` for the same sample. This isn't a bug — Duval Triangle classifies the *ratio* of CH4/C2H4/C2H2 to each other, not their absolute magnitude, so a transformer with tiny trace-gas levels can land in a severe-looking zone by proportion alone even though Status Engine says the gas levels themselves are fine. Shown side-by-side with no context, it reads as contradictory to anyone unfamiliar with the methodology.
  - Option A: leave both fields as-is (technically accurate, matches what the Diagnostics tab already does).
  - Option B: suppress or caveat the Fault Diagnosis line when Status is Normal (e.g. "T3 pattern present, but not diagnostically significant — gas levels are within normal limits").
  - Decide and apply consistently across: `src/lib/selectors.ts` (`buildReportSections`), the Overview tab, and the DTL Excel report.

---

## Cleanup

- **Dead client-side analysis pipeline.** `src/lib/analysis/runAnalysis.ts` (the old in-browser pipeline) and the `createAnalysis` function exposed by `AppProvider` (`src/context/AppProvider.tsx`) are no longer called from anywhere in the UI — confirmed via grep, not just inference. `CLAUDE.md` currently documents this pipeline as "still used by the create-analysis-from-already-saved-sample flow," but that flow doesn't exist anymore; `NewAnalysisPage` goes through the backend API (`POST /transformers/:id/analyses/run`) exclusively now. Either:
  - delete `src/lib/analysis/runAnalysis.ts` + `createAnalysis` + their now-unused re-exports, and update `CLAUDE.md`'s "two parallel pipelines" section, or
  - if there's a planned future use for client-side analysis, say so and keep it — but the docs need to stop claiming it's currently wired to something.
- **Seed data pollution in production-looking lists.** `TX-TEST-Verification-Unit-F` / "Verification Test Bench" (`backend/prisma/seed.ts`) shows up in Transformers, New Analysis, History, and Reports — fine for a dev seed, reads as broken data if ever demoed.
- **No pagination on History/Reports pages.** Fine at 35 rows (current seed size), won't be at 350+. `src/pages/AnalysisHistoryPage.tsx`, `src/pages/ReportsPage.tsx`.

---

## UI/UX — explicitly deferred during the last round of fixes

These were flagged in the UI/UX audit but intentionally left alone at the time ("fix the issues, not the rework"). Still open:

- **No responsive/mobile layout.** Sidebar (`src/components/layout/Sidebar.tsx`) doesn't collapse below ~900px viewport width — everything gets squeezed and labels truncate illegibly.
- **Trends tab chart scale-squashing.** `src/components/charts/TrendCharts.tsx` and the gas bar chart plot values of very different magnitudes (e.g. C2H2 at 10ppm next to CO2 at 900ppm) on one linear axis — the diagnostically important small values become visually invisible. Needs either small-multiples (one chart per gas, own scale) or a log-scale toggle.
- **Dead vertical space.** Dashboard, Transformers list, and Transformer Detail all have content packed into the top ~40% of the viewport with nothing below.
- **Sparse StatCard tiles.** Dashboard's stat tiles are just a number + label, no trend indicator or comparison.
- **No sidebar icons or breadcrumbs.** Plain text nav list; no path context on detail pages beyond a "Back to List" button.

---

## Test coverage

- **Frontend has 2 test files total** (`src/components/visualizations/duvalZones.test.ts`, `src/lib/analysis/delta.test.ts`) — both pure-logic tests. Zero page or component tests exist. Every UI verification done this session was an ad-hoc Playwright script run from scratch and thrown away, never committed to the repo.
- **No E2E suite committed**, despite Playwright being used repeatedly (manually, out-of-repo) to catch real bugs this session — the Reports-page infinite-loop freeze and the empty-form-submission bug were both found this way. Worth formalizing a small Playwright suite covering: New Analysis wizard happy path + empty-submission block, Reports page open/navigate-away, Delete confirmation flow.
- Backend is in good shape by comparison: 313 tests covering every engine, the report builder, and the new sample validator.

---

## Production readiness

Not discussed or worked on at all yet:

- **No authentication or authorization anywhere.** Anyone who can reach the server can read, create, edit, or delete all data — no login, no roles, no API keys.
- **No CI pipeline** (no `.github/workflows` or equivalent).
- **No production deploy config** — only a local dev `docker-compose.yml` for Postgres. No build/deploy story for the actual app (frontend static hosting, backend process management, migrations-on-deploy, etc.).
- No rate limiting or broader input sanitization beyond the one sample-validation check added this session (`backend/src/lib/validation/sample.ts`).

---

## Deliberate, documented non-goals

Not bugs — called out explicitly in the spec docs as accepted scope cuts. Listed here only so the full picture is in one place; no action implied unless priorities change.

- No two-stage confirmation-sample workflow (`docs/IEEE_STATUS_LOGIC.md`, IEEE Clause 6.1.1 Steps 4a–4e).
- No O2/N2-near-0.2 hysteresis damping (`docs/IEEE_STATUS_LOGIC.md`, Clause 6.1.1 Step 3).
- No longitudinal reassessment / year-of-stable-samples de-escalation (`docs/DGA_RECOMMENDATIONS.md`, Clause 6.1.2.2/6.1.2.3).
- No company-specific DGA policy overrides (`docs/DGA_RECOMMENDATIONS.md`).
