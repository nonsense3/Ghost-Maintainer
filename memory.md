# Ghost Maintainer — session memory

Last updated: 2026-10-07 (flagship update)

## Product source

- **PRD:** Desktop PDF (8 pages in `prd-pages/`) — MVP: fetcher, Gemma linguistic, SQL behavior, combined score, dashboard, CLI.
- **Design:** `DESIGN-apple.md` → `web/src/app/globals.css` + components.

## Stack

- **Storage & Analytics:** PostgreSQL / Supabase + Snowflake Cortex SQL (`sql/`).
- **App:** Next.js 16 in `web/` with Apple design system aesthetic.
- **Local AI:** Gemma 2 (via Ollama, llama.cpp, or Snowflake Cortex).
- **CLI:** Python (`cli/scan.py`) & Node.js (`cli/scan.mjs`).

## Completed Work

- [x] Auth (email + GitHub OAuth), middleware, login/dashboard shell
- [x] DB migrations:
  - `supabase/migrations/20260307180000_init.sql` (core tables + RLS)
  - `supabase/migrations/20260307200000_flatten_view.sql` (event flattening view)
  - `supabase/migrations/20260307210000_behavior_views.sql` (5 behavioral signal views)
- [x] **SQL Analytics Layer (`sql/`):**
  - `01_tables.sql` (Snowflake & Postgres DDL)
  - `02_flatten_views.sql` (Relational normalization)
  - `03_cortex_scoring.sql` (Snowflake Cortex Gemma completion)
  - `04_behavior_signals.sql` (PRD §5 window functions, moving averages, Z-score)
  - `05_risk_score.sql` (Combined risk calculation view)
- [x] **CLI Scanner:**
  - `cli/scan.py` (Python CLI with Gemma Ollama and GitHub API)
  - `cli/scan.mjs` (Zero-dependency Node CLI with `demo` and `scan-deps`)
- [x] **Python Ingestion & Snowflake Loaders (`fetcher/`):**
  - `fetch_github.py` (Paginated commit, PR, issue, comment ingestion with caching)
  - `load_snowflake.py` (Snowflake raw JSON VARIANT loader)
- [x] **Interactive Web Surfaces (`web/`):**
  - Apple design system landing page with alternating product tiles
  - Live Interactive Incident Study: `xz-utils` vs `flask` vs `event-stream`
  - In-browser Dependency Scanner for `package.json` triage
  - SQL Window Functions Engine showcase
  - Repo detail page with Risk Gauge, Trend Chart, Behavioral meters, and Gemma quote explanations
  - Preset case study deep-links for immediate judge testing with zero config needed
- [x] **Documentation (`docs/`):**
  - `docs/ARCHITECTURE.md` (System diagram, math formulas, data flow)
  - `docs/DEMO_SCRIPT.md` (3-minute hackathon presentation script)
  - `docs/JUDGES_GUIDE.md` (Track-by-track proof mapping)
- [x] **Git Repository:**
  - Remote configured to `https://github.com/nonsense3/Ghost-Maintainer.git`
  - Clean initial commit pushed to `main`

## Next moves

1. Run `git push origin main` for newly created flagship features.
2. User: optionally configure Supabase project + `web/.env.local` for custom private repository tracking.
3. Install Ollama + `ollama pull gemma2:9b` for live offline linguistic scoring.

