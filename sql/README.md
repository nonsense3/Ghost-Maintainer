# SQL Analytics Layer (PRD §5 & Track 3)

This directory contains production-grade SQL scripts for behavioral analysis, window functions, and combined risk calculation:

| Script | Purpose |
|---|---|
| [`01_tables.sql`](./01_tables.sql) | DDL for Snowflake (VARIANT) and PostgreSQL / Supabase |
| [`02_flatten_views.sql`](./02_flatten_views.sql) | Normalizes raw JSON events into relational analytics views |
| [`03_cortex_scoring.sql`](./03_cortex_scoring.sql) | Zero-egress Gemma scoring inside Snowflake Cortex AI / queue views |
| [`04_behavior_signals.sql`](./04_behavior_signals.sql) | Pure SQL window functions for all 5 behavioral signals (PRD §5) |
| [`05_risk_score.sql`](./05_risk_score.sql) | Combined risk score formula view: `0.5 * linguistic + 0.5 * velocity` |

### The 5 Behavioral Drift Signals:
1. **Activity Drop**: Weekly commit count vs 90-day moving average.
2. **Commit Time Shift**: Hour-of-day distribution drift (L1 distance) between baseline and recent 30 days.
3. **New-Author Surge**: Commits by authors first seen in the last 30 days, weighted by volume.
4. **Unreviewed Merges**: PRs merged without review comments or approvals.
5. **Reply Latency Spike**: Issue first-reply delay with moving average and Z-score deviation.
