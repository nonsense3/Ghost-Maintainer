# Ghost Maintainer — session memory

Last updated: 2026-10-07 (continued)

## Product source

- **PRD:** Desktop PDF (8 pages) — MVP: fetcher, Gemma linguistic, SQL behavior, combined score, dashboard.
- **Design:** `DESIGN-apple.md` → `web/src/app/globals.css` + components.

## Stack

- **Auth + DB:** Supabase (replaces PRD Snowflake track).
- **App:** Next.js 16 in `web/`.
- **Secrets:** Server-only env — see `web/.env.example`.

## Done

- [x] Auth (email + GitHub OAuth), middleware, login/dashboard shell
- [x] DB migration: core tables + RLS; flatten view migration `20260307200000_flatten_view.sql`
- [x] **Full ingest:** commits, PRs, issues, comments (~6 months, paginated) → `collectRepositoryEvents`
- [x] **Gemma/Ollama:** `web/src/lib/gemma/score.ts` (optional remote API via `GEMMA_API_*`)
- [x] **Behavior analytics:** TS implementation of PRD §5 signals → `behavior_signals`
- [x] **Risk formula:** `0.5 * linguistic + 0.5 * velocity` → `risk_scores`
- [x] **API:** `POST /api/repos/ingest`, `POST /api/repos/[id]/analyze`
- [x] **Dashboard UI:** add repo form, repo list with scores, `/dashboard/repos/[id]` gauge, trend, red flags, explain panel

## Next moves

1. User: Supabase project + `web/.env.local` + run both SQL migrations.
2. Install Ollama + `ollama pull gemma2:9b` (or set `GEMMA_MODEL`) for linguistic scores.
3. **Harden behavior SQL** — move `computeBehaviorSignals` into Postgres functions (PRD judge-friendly SQL).
4. **GraphQL fetcher** — richer PR review / merge metadata for unreviewed merges.
5. **Demo mode** — preset “healthy vs hijacked” repo pair on home page.
6. **CLI** — `ghost-maintainer scan owner/repo` (Python or Node).
7. **Alerts** — email/Slack when score crosses threshold.

## Key paths

| Path | Purpose |
|------|---------|
| `web/src/lib/github/ingest.ts` | GitHub → event rows |
| `web/src/lib/analytics/run-analysis.ts` | Score + behavior + risk pipeline |
| `web/src/app/dashboard/repos/[id]/page.tsx` | Repo detail UI |

## Notes

- Analysis batches **15 unscored** comment/issue bodies per run (rate-limit friendly).
- Without Ollama, behavior + velocity still run; linguistic stays 0 until Gemma responds.
