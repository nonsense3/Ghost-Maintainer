# Ghost Maintainer — Judge-Friendly Track Guide (PRD §13)

This document maps how Ghost Maintainer fulfills each hackathon track requirement with concrete proofs, code locations, and architectural choices.

---

## Track 1: Open Source AI & Gemma

### What judges should see:
- Open-weight model execution (`gemma2:9b` via Ollama / llama.cpp or Snowflake Cortex).
- Privacy-friendly, zero external data leakage, capable of running offline on a developer laptop.
- Structured JSON output contract: `{"risk_score": 0-100, "signals": [...], "reason": "..."}`.

### Code Proof:
| Component | File Path | Implementation Details |
|---|---|---|
| **Local Gemma Ingestion** | [`web/src/lib/gemma/score.ts`](../web/src/lib/gemma/score.ts) | Calls local Ollama endpoint with strict JSON schema parsing and fallback regex matchers. |
| **Local CLI Scanner** | [`cli/scan.py`](../cli/scan.py) & [`cli/scan.mjs`](../cli/scan.mjs) | Runs Gemma analysis locally on terminal with zero internet needed for LLM inference. |
| **In-Database Cortex Gemma** | [`sql/03_cortex_scoring.sql`](../sql/03_cortex_scoring.sql) | `SNOWFLAKE.CORTEX.COMPLETE('gemma-7b', ...)` evaluates raw comments inside SQL. |

---

## Track 2: GitHub Copilot

### What judges should see:
- AI-assisted scaffolding for complex statistical window functions, GitHub event pagination, and Apple-spec responsive components.
- Clear demonstration of prompt craftsmanship and development velocity.

### Highlights:
- **Complex SQL Generation:** Copilot accelerated author tenure calculation, 24-hour distribution histograms ($L_1$ drift), and issue first-reply delay Z-scores in [`sql/04_behavior_signals.sql`](../sql/04_behavior_signals.sql).
- **GitHub Ingest Pipeline:** Multi-endpoint pagination with rate-limit backoff across Commits, Pull Requests, Issues, and Issue Comments in [`web/src/lib/github/ingest.ts`](../web/src/lib/github/ingest.ts).
- **Design System Fidelity:** Translating design specifications into Tailwind tokens and typography clamp curves.

---

## Track 3: Snowflake / SQL Data Layer

### What judges should see:
- Ingestion of raw, semi-structured GitHub JSON directly into database columns (`VARIANT` / `jsonb`) with zero upfront schema deformation.
- Pure SQL transformation views for relational normalization.
- Advanced SQL window functions: moving averages, historical baseline partitioning, and distribution drift.

### Code Proof:
| Script | Purpose |
|---|---|
| [`sql/01_tables.sql`](../sql/01_tables.sql) | DDL for both Snowflake and PostgreSQL / Supabase storage layers. |
| [`sql/02_flatten_views.sql`](../sql/02_flatten_views.sql) | Flattens nested JSON payloads into normalized time, author, and review metrics. |
| [`sql/04_behavior_signals.sql`](../sql/04_behavior_signals.sql) | Pure SQL implementations of all 5 behavioral signals using `AVG() OVER()`, `PARTITION BY`, and distribution histograms. |
| [`sql/05_risk_score.sql`](../sql/05_risk_score.sql) | Combined risk score formula view: `0.5 * linguistic + 0.5 * velocity`. |
