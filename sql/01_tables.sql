-- ============================================================================
-- 01_tables.sql — Ghost Maintainer Storage Layer (DDL)
-- Supports both Snowflake (PRD Track 3) and PostgreSQL / Supabase
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SNOWFLAKE VERSION (PRD Track 3: Raw JSON in VARIANT column, zero-egress)
-- ----------------------------------------------------------------------------
/*
CREATE DATABASE IF NOT EXISTS GHOST_MAINTAINER;
USE DATABASE GHOST_MAINTAINER;
CREATE SCHEMA IF NOT EXISTS ANALYTICS;
USE SCHEMA ANALYTICS;

-- Repositories registered for monitoring
CREATE OR REPLACE TABLE repositories (
    id VARCHAR(36) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    default_branch VARCHAR(100) DEFAULT 'main',
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Raw GitHub events (PRD §4: raw JSON loaded directly into VARIANT)
CREATE OR REPLACE TABLE raw_github_events (
    id NUMBER AUTOINCREMENT PRIMARY KEY,
    repository_id VARCHAR(36) NOT NULL REFERENCES repositories(id),
    source VARCHAR(20) NOT NULL, -- 'commit', 'pr', 'issue', 'comment'
    external_id VARCHAR(100) NOT NULL,
    occurred_at TIMESTAMP_NTZ NOT NULL,
    payload VARIANT NOT NULL,
    ingested_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (repository_id, source, external_id)
);

-- Gemma Linguistic Scores (PRD §3 Track 1 & Cortex completion output)
CREATE OR REPLACE TABLE comment_scores (
    id NUMBER AUTOINCREMENT PRIMARY KEY,
    repository_id VARCHAR(36) NOT NULL REFERENCES repositories(id),
    event_id NUMBER NOT NULL REFERENCES raw_github_events(id),
    risk_score NUMBER(3, 0) NOT NULL, -- 0 to 100
    signals VARIANT DEFAULT PARSE_JSON('[]'),
    reason VARCHAR(1000),
    model VARCHAR(100),
    scored_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (event_id)
);

-- Weekly Behavioral Drift Signals (PRD §5)
CREATE OR REPLACE TABLE behavior_signals (
    id NUMBER AUTOINCREMENT PRIMARY KEY,
    repository_id VARCHAR(36) NOT NULL REFERENCES repositories(id),
    week_start DATE NOT NULL,
    signal_key VARCHAR(50) NOT NULL,
    score NUMBER(3, 0) NOT NULL,
    detail VARIANT DEFAULT PARSE_JSON('{}'),
    computed_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (repository_id, week_start, signal_key)
);

-- Final Combined Risk Scores (PRD §6: 0.5 * linguistic + 0.5 * velocity)
CREATE OR REPLACE TABLE risk_scores (
    id NUMBER AUTOINCREMENT PRIMARY KEY,
    repository_id VARCHAR(36) NOT NULL REFERENCES repositories(id),
    week_start DATE NOT NULL,
    linguistic_score NUMBER(3, 0) NOT NULL,
    velocity_score NUMBER(3, 0) NOT NULL,
    risk_score NUMBER(3, 0) NOT NULL,
    band VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    red_flags VARIANT DEFAULT PARSE_JSON('[]'),
    computed_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (repository_id, week_start)
);
*/

-- ----------------------------------------------------------------------------
-- POSTGRESQL / SUPABASE VERSION (Production App Stack)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    display_name TEXT,
    github_token TEXT,
    github_username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (owner || '/' || name) STORED,
    default_branch TEXT DEFAULT 'main',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner, name)
);

CREATE TABLE IF NOT EXISTS public.raw_github_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES public.repositories (id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('commit', 'pr', 'issue', 'comment')),
    external_id TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (repository_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_raw_events_repo_time ON public.raw_github_events (repository_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_events_payload_gin ON public.raw_github_events USING gin (payload);

CREATE TABLE IF NOT EXISTS public.comment_scores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES public.repositories (id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.raw_github_events (id) ON DELETE CASCADE,
    risk_score SMALLINT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    reason TEXT,
    model TEXT,
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id)
);

CREATE TABLE IF NOT EXISTS public.behavior_signals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES public.repositories (id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    signal_key TEXT NOT NULL,
    score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (repository_id, week_start, signal_key)
);

CREATE TABLE IF NOT EXISTS public.risk_scores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id UUID NOT NULL REFERENCES public.repositories (id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    linguistic_score SMALLINT NOT NULL CHECK (linguistic_score BETWEEN 0 AND 100),
    velocity_score SMALLINT NOT NULL CHECK (velocity_score BETWEEN 0 AND 100),
    risk_score SMALLINT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    band TEXT NOT NULL CHECK (band IN ('low', 'medium', 'high')),
    red_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (repository_id, week_start)
);
