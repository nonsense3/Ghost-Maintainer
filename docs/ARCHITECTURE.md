# Architecture

This document describes the system architecture, data model, scoring methodology, and deployment topology of Ghost Maintainer.

---

## Table of Contents

- [Overview](#overview)
- [System Layers](#system-layers)
  - [1. Data Ingestion](#1-data-ingestion)
  - [2. Storage](#2-storage)
  - [3. Normalization](#3-normalization)
  - [4. Analytics Engine](#4-analytics-engine)
  - [5. Risk Scoring](#5-risk-scoring)
  - [6. User Interfaces](#6-user-interfaces)
- [Data Model](#data-model)
- [Risk Score Formula](#risk-score-formula)
- [Behavioral Signals](#behavioral-signals)
- [Linguistic Analysis](#linguistic-analysis)
- [Authentication & Authorization](#authentication--authorization)
- [Deployment Topology](#deployment-topology)

---

## Overview

Ghost Maintainer operates on a fundamental premise: supply chain compromises leave behavioral traces in public repository metadata long before malicious code is merged. The system monitors the **human and organizational layer** of open-source projects — maintainer activity patterns, communication tone, contributor onboarding velocity, and code review discipline — to produce a quantitative risk assessment.

The architecture follows a five-layer pipeline:

```
Ingestion → Storage → Normalization → Analysis → Scoring → Delivery
```

Each layer is independently deployable. The CLI scanner operates fully offline using pre-computed telemetry. The web dashboard connects to a live Supabase instance for persistent repository tracking. Snowflake provides an alternative storage backend with in-database LLM inference via Cortex AI.

---

## System Layers

### 1. Data Ingestion

**Source:** [`fetcher/fetch_github.py`](../fetcher/fetch_github.py)

The ingestion layer collects raw event data from the GitHub REST API across four event types:

| Event Type | API Endpoint | Data Captured |
|---|---|---|
| **Commits** | `/repos/:owner/:repo/commits` | SHA, author, timestamp, commit message, line stats |
| **Pull Requests** | `/repos/:owner/:repo/pulls` | State, merge status, review comment count, author |
| **Issues** | `/repos/:owner/:repo/issues` | Title, body, state, timestamps, author |
| **Comments** | `/repos/:owner/:repo/issues/:number/comments` | Body text, author, creation timestamp, issue linkage |

Key behaviors:
- Paginated fetching with a default lookback window of 6 months.
- Rate limit detection with graceful degradation when `GITHUB_TOKEN` is not configured.
- Local JSON cache written to disk before any database upload, ensuring data is never lost to transient failures.
- Batch upsert to Supabase via the PostgREST API with `merge-duplicates` conflict resolution.
- Input validation via regex to prevent path traversal in owner/repo arguments.

### 2. Storage

**Source:** [`sql/01_tables.sql`](../sql/01_tables.sql)

The storage layer supports two database backends with equivalent schemas:

#### PostgreSQL / Supabase (Primary)

| Table | Purpose |
|---|---|
| `profiles` | User accounts linked to Supabase Auth, storing GitHub tokens and display metadata |
| `repositories` | Tracked repositories with computed `full_name` (generated column: `owner || '/' || name`) |
| `raw_github_events` | Raw GitHub API responses stored as `JSONB`, indexed with GIN for arbitrary path queries |
| `comment_scores` | Gemma linguistic evaluation results per event (score 0–100, signals array, reason text) |
| `behavior_signals` | Weekly behavioral signal scores per repository, keyed by `signal_key` |
| `risk_scores` | Combined weekly risk scores with band classification and red flag aggregation |

Indexes:
- `idx_raw_events_repo_time` — Composite B-tree on `(repository_id, occurred_at DESC)` for time-range queries.
- `idx_raw_events_payload_gin` — GIN index on the `payload` JSONB column for arbitrary field lookups.

All tables enforce check constraints on score ranges (`BETWEEN 0 AND 100`) and enum values (`band IN ('low', 'medium', 'high')`).

#### Snowflake (Alternative)

The Snowflake backend stores raw events in a `VARIANT` column with zero data transformation at ingest time. Normalization and analysis happen entirely within SQL views and stored procedures. The Snowflake loader is implemented in [`fetcher/load_snowflake.py`](../fetcher/load_snowflake.py).

### 3. Normalization

**Source:** [`sql/02_flatten_views.sql`](../sql/02_flatten_views.sql)

The `github_events_flat` view normalizes heterogeneous raw JSON payloads into a uniform relational schema:

| Column | Derivation |
|---|---|
| `author` | Extracted from `payload.author.login` (commits) or `payload.user.login` (PRs/issues/comments), falling back to `commit.author.name` then `'anonymous'` |
| `body` | Commit message, comment body, or issue body/title depending on source type |
| `week_start` | `DATE_TRUNC('week', occurred_at)` for weekly aggregation alignment |
| `hour_of_day` | `EXTRACT(HOUR FROM occurred_at)` for commit-time distribution analysis |
| `lines_changed` | `payload.stats.total` for commits; `0` for all other event types |
| `is_merged` | `TRUE` when `payload.merged_at IS NOT NULL` for PRs; `FALSE` otherwise |
| `review_comments_count` | `payload.review_comments` for PRs; `0` otherwise |

Both PostgreSQL and Snowflake implementations produce identical output schemas. The PostgreSQL version uses `#>>` JSONB path operators; the Snowflake version uses `:` path notation on `VARIANT`.

### 4. Analytics Engine

The analytics engine operates on two independent tracks that run in parallel:

#### Track A: Linguistic Analysis (Gemma 4B)

**Source:** [`sql/03_cortex_scoring.sql`](../sql/03_cortex_scoring.sql), [`web/src/lib/gemma/`](../web/src/lib/gemma/)

The linguistic track evaluates maintainer communications for signs of burnout, coercion, and social engineering. Gemma receives the raw text of comments and issue bodies and returns a structured JSON response:

```json
{
  "risk_score": 0-100,
  "signals": ["exhaustion", "hostile_takeover", "urgency_pressure"],
  "reason": "One-sentence explanation"
}
```

Detection targets:
- **Exhaustion indicators** — Expressions of frustration, "I need help maintaining", extended absence apologies.
- **Coercion patterns** — Pushy new contributors demanding merge access, artificial urgency.
- **Sockpuppet signals** — Sudden shifts in writing style, persona inconsistencies.
- **Takeover language** — Requests for ownership transfer, maintainer credential sharing.

Deployment options:
- **Local Ollama** — Zero-egress, runs on the developer's machine via `http://127.0.0.1:11434`.
- **Snowflake Cortex AI** — In-database inference via `SNOWFLAKE.CORTEX.COMPLETE('gemma-7b', ...)`, keeping data within the Snowflake security perimeter.

The `comments_pending_scoring` view provides a work queue of unevaluated comments for batch processing.

#### Track B: Behavioral Signal Engine (SQL)

**Source:** [`sql/04_behavior_signals.sql`](../sql/04_behavior_signals.sql)

Five behavioral signals are computed entirely in SQL using window functions, CTEs, and aggregate filters. Each signal produces a score from 0 to 100. See [Behavioral Signals](#behavioral-signals) for detailed specifications.

### 5. Risk Scoring

**Source:** [`sql/05_risk_score.sql`](../sql/05_risk_score.sql)

The `view_combined_repository_risk` view merges the linguistic and behavioral tracks into a single risk index per repository per week. See [Risk Score Formula](#risk-score-formula) for the calculation.

### 6. User Interfaces

#### Web Dashboard

**Source:** [`web/src/app/`](../web/src/app/)

A Next.js 16 application using the App Router with the following pages:

| Route | Component | Purpose |
|---|---|---|
| `/` | Landing page | Product overview with incident case study links |
| `/login` | Auth page | Email and GitHub OAuth authentication via Supabase |
| `/dashboard` | Repository list | Risk summary for all tracked repositories |
| `/dashboard/repos/[owner]/[repo]` | Detail page | Risk gauge, trend chart, behavioral meters, Gemma explanations |

Key UI components ([`web/src/components/`](../web/src/components/)):
- `demo-comparison.tsx` — Side-by-side incident study (xz-utils vs. flask vs. event-stream)
- `dependency-scanner-card.tsx` — In-browser package.json triage
- `sql-signals-showcase.tsx` — Interactive breakdown of all 5 behavioral signals
- `risk-gauge.tsx` — Animated SVG risk score gauge
- `risk-trend.tsx` — Score trend visualization over time
- `explain-score-panel.tsx` — Gemma reasoning display panel
- `repo-scan-modal.tsx` — Repository scanning modal with live progress

#### CLI Scanner

**Source:** [`cli/scan.mjs`](../cli/scan.mjs) (Node.js), [`cli/scan.py`](../cli/scan.py) (Python)

The CLI provides three modes:
- **`demo`** — Displays pre-computed risk assessments for known supply chain incidents.
- **`scan <owner>/<repo>`** — Fetches live GitHub data and computes a risk score.
- **`scan-deps --file <path>`** — Parses a `package.json` and batch-scans all dependencies.

The Node.js scanner (`scan.mjs`) is zero-dependency and works without any external packages.

---

## Data Model

```
┌──────────────┐       ┌───────────────────────┐       ┌─────────────────┐
│   profiles   │       │     repositories      │       │  comment_scores │
│──────────────│       │───────────────────────│       │─────────────────│
│ id (UUID)    │       │ id (UUID)             │◄──────│ repository_id   │
│ display_name │       │ user_id → profiles.id │       │ event_id        │
│ github_token │       │ owner                 │       │ risk_score      │
│ avatar_url   │       │ name                  │       │ signals (JSONB) │
└──────────────┘       │ full_name (generated) │       │ reason          │
                       └──────────┬────────────┘       │ model           │
                                  │                    └─────────────────┘
                                  │
                       ┌──────────▼────────────┐       ┌──────────────────┐
                       │  raw_github_events    │       │ behavior_signals │
                       │───────────────────────│       │──────────────────│
                       │ id (BIGINT)           │       │ repository_id    │
                       │ repository_id         │       │ week_start       │
                       │ source (enum)         │       │ signal_key       │
                       │ external_id           │       │ score (0–100)    │
                       │ occurred_at           │       │ detail (JSONB)   │
                       │ payload (JSONB)       │       └──────────────────┘
                       │ ingested_at           │
                       └───────────────────────┘       ┌──────────────────┐
                                                       │   risk_scores    │
                                                       │──────────────────│
                                                       │ repository_id    │
                                                       │ week_start       │
                                                       │ linguistic_score │
                                                       │ velocity_score   │
                                                       │ risk_score       │
                                                       │ band             │
                                                       │ red_flags (JSONB)│
                                                       └──────────────────┘
```

All foreign keys cascade on delete. Row Level Security (RLS) on Supabase ensures that authenticated users can only access their own repositories and associated data.

---

## Risk Score Formula

The combined risk score is a weighted average of two independent assessments:

```
Risk Score = 0.5 × Linguistic Score + 0.5 × Velocity Score
```

- **Linguistic Score (0–100):** Weekly average of Gemma risk evaluations across all analyzed comments for a repository.
- **Velocity Score (0–100):** Arithmetic mean of the 5 behavioral signal scores for that week.

### Risk Bands

| Band | Score Range | Interpretation |
|---|---|---|
| **Low** | 0–33 | Stable multi-maintainer cadence, healthy communication tone, regular peer reviews. |
| **Medium** | 34–66 | Noticeable activity slowdown, increasing reply latency, or solo maintainer stress indicators. |
| **High** | 67–100 | Severe burnout signals, sudden off-hours commit shifts, or significant unreviewed commits by new authors. |

The final view (`view_combined_repository_risk`) joins linguistic and velocity summaries via `FULL OUTER JOIN` to produce scores even when only one track has data for a given week.

---

## Behavioral Signals

Each signal is implemented as an independent SQL view operating on the `github_events_flat` normalization layer. All views output the same schema: `(repository_id, week_start, signal_key, score, detail)`.

### Signal 1: Activity Drop

**View:** `view_signal_activity_drop`

Measures the decline in weekly commit and PR activity relative to a 90-day moving baseline.

```
score = (1 − current_weekly / baseline_90d_avg) × 100
```

- The baseline is computed using a sliding window of the 12 preceding weeks (`ROWS BETWEEN 12 PRECEDING AND 1 PRECEDING`).
- Score is clamped to `[0, 100]`. A score of 0 indicates activity at or above baseline.
- The `detail` JSONB includes `current_weekly` and `baseline_90d_avg` for transparency.

### Signal 2: Commit Time Shift

**View:** `view_signal_commit_time_shift`

Detects changes in the hour-of-day distribution of commits using L₁ distance between the baseline (30–120 days ago) and recent (last 30 days) histograms.

```
L₁ = Σ |P_recent(h) − P_baseline(h)|    for h ∈ {0, 1, ..., 23}
score = L₁ × 50
```

- Each hour bucket is normalized to a proportion of total commits in its window.
- A `FULL OUTER JOIN` between recent and baseline proportions handles hours with activity in only one period.
- Maximum possible L₁ is 2.0 (completely disjoint distributions), mapping to a score of 100.

### Signal 3: New-Author Surge

**View:** `view_signal_new_author_surge`

Quantifies the proportion of recent commits attributable to authors whose first contribution to the repository was within the last 30 days.

```
score = (new_author_commits / total_recent_commits) × 100
```

- Author tenure is determined by `MIN(occurred_at)` across all commits.
- The `detail` JSONB reports `total_recent_commits`, `new_author_commits`, and `new_authors_count`.

### Signal 4: Unreviewed Merges

**View:** `view_signal_unreviewed_merges`

Measures the fraction of merged pull requests in the last 30 days that received zero review comments and contain no reference to a review process.

```
score = (unreviewed_merged_prs / total_merged_prs) × 100
```

- A PR is considered "unreviewed" when `review_comments = 0` AND the body does not contain the word "review" (case-insensitive).
- Only PRs with `merged_at IS NOT NULL` are included.

### Signal 5: Reply Latency Spike

**View:** `view_signal_reply_latency_spike`

Detects significant increases in issue response time using Z-score deviation.

```
Z = (μ_recent − μ_baseline) / σ_baseline
score = min(4.0, Z) × 25
```

- Reply delay is measured as the time between issue creation and the first comment (in hours), joined via `issue_number`.
- The baseline window spans 30–120 days ago; the recent window covers the last 30 days.
- Z-scores are capped at 4.0, mapping to a maximum score of 100.
- A score of 0 indicates reply latency at or below baseline.

---

## Linguistic Analysis

The Gemma prompt template instructs the model to evaluate a single comment or issue body against a threat taxonomy:

```
You assess open-source maintainer burnout and hijack risk from a single
GitHub comment or issue body. Compare tone to a tired but honest maintainer
vs a hostile takeover. Output valid JSON only:
{"risk_score":0-100,"signals":["..."],"reason":"one sentence"}

Look for: frustration, "I need help maintaining", sudden style change,
pushy new contributors, vague urgency.
```

The model's JSON response is parsed and stored in the `comment_scores` table. On Snowflake, this happens within a stored procedure (`SCORE_UNSCORED_COMMENTS`) using `TRY_PARSE_JSON` and `REGEXP_SUBSTR` for robust extraction. In the web application, inference is handled by the Ollama client in [`web/src/lib/gemma/`](../web/src/lib/gemma/).

---

## Authentication & Authorization

**Source:** [`web/src/middleware.ts`](../web/src/middleware.ts)

The web application uses Supabase Auth with two authentication methods:
- **Email/password** registration and login.
- **GitHub OAuth** for streamlined developer onboarding.

The Next.js middleware enforces the following access control:

| Route Pattern | Auth Required | Behavior |
|---|---|---|
| `/` | No | Public landing page with demos |
| `/login`, `/auth/*` | No | Authentication pages; authenticated users are redirected to `/dashboard` |
| `/dashboard/*` | Yes | Redirects to `/login` with a `next` query parameter for return navigation |
| `/api/repos/*` | Yes | Protected API routes for repository management |

When Supabase credentials are not configured, the middleware gracefully degrades: protected routes redirect to `/login`, but public routes (landing page, demos) remain fully accessible.

Database-level Row Level Security (RLS) provides a second authorization boundary, ensuring that even direct database access is scoped to the authenticated user's repositories.

---

## Deployment Topology

### Minimal (Demo / CLI Only)

No external services required. The CLI scanner runs entirely locally using pre-computed telemetry.

```
Developer Machine
└── Node.js / Python CLI
    └── Pre-computed incident data (embedded)
```

### Standard (Web Dashboard)

```
Developer Machine
├── Next.js Dev Server (localhost:3000)
├── Ollama (localhost:11434, optional)
│   └── Gemma 4B model
└── Supabase (cloud)
    ├── PostgreSQL (data storage, RLS)
    └── Auth (email + GitHub OAuth)
```

### Full (With Snowflake)

```
Developer Machine
├── Next.js Dev Server
├── Python Fetcher (batch ingestion)
└── Ollama (local inference)

Supabase (cloud)
├── PostgreSQL
└── Auth

Snowflake (cloud)
├── VARIANT storage (raw JSON)
├── SQL views (behavioral signals)
└── Cortex AI (in-database Gemma inference)
```
