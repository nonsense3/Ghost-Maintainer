-- Ghost Maintainer — Supabase replaces Snowflake for auth + analytics storage (PRD §4–6)

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tracked repositories (per user)
create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  owner text not null,
  name text not null,
  full_name text generated always as (owner || '/' || name) stored,
  default_branch text default 'main',
  created_at timestamptz not null default now(),
  unique (user_id, owner, name)
);

alter table public.repositories enable row level security;

create policy "Users manage own repos"
  on public.repositories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Raw GitHub JSON (PRD: raw_github_events VARIANT → jsonb)
create table public.raw_github_events (
  id bigint generated always as identity primary key,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  source text not null check (source in ('commit', 'pr', 'issue', 'comment')),
  external_id text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  ingested_at timestamptz not null default now(),
  unique (repository_id, source, external_id)
);

create index raw_github_events_repo_time on public.raw_github_events (repository_id, occurred_at desc);
create index raw_github_events_payload_gin on public.raw_github_events using gin (payload);

alter table public.raw_github_events enable row level security;

create policy "Events visible for owned repos"
  on public.raw_github_events for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id and r.user_id = auth.uid()
    )
  );

-- Linguistic scores (Gemma / Ollama output)
create table public.comment_scores (
  id bigint generated always as identity primary key,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  event_id bigint not null references public.raw_github_events (id) on delete cascade,
  risk_score smallint not null check (risk_score between 0 and 100),
  signals jsonb not null default '[]'::jsonb,
  reason text,
  model text,
  scored_at timestamptz not null default now(),
  unique (event_id)
);

alter table public.comment_scores enable row level security;

create policy "Comment scores visible for owned repos"
  on public.comment_scores for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id and r.user_id = auth.uid()
    )
  );

-- Weekly behavior signals (SQL analytics — PRD §5)
create table public.behavior_signals (
  id bigint generated always as identity primary key,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  week_start date not null,
  signal_key text not null,
  score smallint not null check (score between 0 and 100),
  detail jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (repository_id, week_start, signal_key)
);

alter table public.behavior_signals enable row level security;

create policy "Behavior signals visible for owned repos"
  on public.behavior_signals for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id and r.user_id = auth.uid()
    )
  );

-- Combined risk (PRD: Risk = 0.5 * linguistic + 0.5 * velocity)
create table public.risk_scores (
  id bigint generated always as identity primary key,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  week_start date not null,
  linguistic_score smallint not null check (linguistic_score between 0 and 100),
  velocity_score smallint not null check (velocity_score between 0 and 100),
  risk_score smallint not null check (risk_score between 0 and 100),
  band text not null check (band in ('low', 'medium', 'high')),
  red_flags jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now(),
  unique (repository_id, week_start)
);

alter table public.risk_scores enable row level security;

create policy "Risk scores visible for owned repos"
  on public.risk_scores for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id and r.user_id = auth.uid()
    )
  );

-- Service role writes ingestion/scoring (no insert policies for anon/authenticated on raw events)

