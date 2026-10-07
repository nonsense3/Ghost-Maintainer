# SQL analytics (Postgres / Supabase)

PRD Snowflake scripts are adapted here for Supabase Postgres.

- `supabase/migrations/20260307180000_init.sql` — tables + RLS
- Next: `04_behavior_signals.sql` — commit time shift, reply latency, activity drop (PRD §5)

Run migrations via Supabase CLI: `supabase db push` or paste into the SQL editor.
