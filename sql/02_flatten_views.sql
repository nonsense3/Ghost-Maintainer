-- ============================================================================
-- 02_flatten_views.sql — PRD Step 4: Flatten Raw JSON into Analytics Views
-- Normalizes author, occurred_at, body, type, additions, deletions, and state.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- POSTGRESQL / SUPABASE VIEW
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.github_events_flat AS
SELECT
    e.id AS event_id,
    e.repository_id,
    e.source,
    e.occurred_at,
    DATE_TRUNC('week', e.occurred_at)::date AS week_start,
    EXTRACT(HOUR FROM e.occurred_at)::integer AS hour_of_day,
    CASE e.source
        WHEN 'commit' THEN COALESCE(
            e.payload #>> '{author,login}',
            e.payload #>> '{commit,author,name}',
            'anonymous'
        )
        ELSE COALESCE(e.payload #>> '{user,login}', 'anonymous')
    END AS author,
    CASE e.source
        WHEN 'commit' THEN e.payload #>> '{commit,message}'
        WHEN 'comment' THEN e.payload ->> 'body'
        ELSE COALESCE(e.payload ->> 'body', e.payload ->> 'title')
    END AS body,
    CASE e.source
        WHEN 'commit' THEN COALESCE((e.payload #>> '{stats,total}')::integer, 0)
        ELSE 0
    END AS lines_changed,
    CASE e.source
        WHEN 'pr' THEN (e.payload ->> 'merged_at') IS NOT NULL
        ELSE FALSE
    END AS is_merged,
    CASE e.source
        WHEN 'pr' THEN COALESCE((e.payload ->> 'review_comments')::integer, 0)
        ELSE 0
    END AS review_comments_count,
    e.payload
FROM public.raw_github_events e;

COMMENT ON VIEW public.github_events_flat IS
    'Normalized author, time, hour-of-day, lines_changed and body for PRD §4-5 behavioral signals.';

-- ----------------------------------------------------------------------------
-- SNOWFLAKE VERSION
-- ----------------------------------------------------------------------------
/*
CREATE OR REPLACE VIEW GHOST_MAINTAINER.ANALYTICS.GITHUB_EVENTS_FLAT AS
SELECT
    e.id AS event_id,
    e.repository_id,
    e.source,
    e.occurred_at,
    DATE_TRUNC('week', e.occurred_at)::date AS week_start,
    DATE_PART(HOUR, e.occurred_at) AS hour_of_day,
    CASE e.source
        WHEN 'commit' THEN COALESCE(
            e.payload:author:login::STRING,
            e.payload:commit:author:name::STRING,
            'anonymous'
        )
        ELSE COALESCE(e.payload:user:login::STRING, 'anonymous')
    END AS author,
    CASE e.source
        WHEN 'commit' THEN e.payload:commit:message::STRING
        WHEN 'comment' THEN e.payload:body::STRING
        ELSE COALESCE(e.payload:body::STRING, e.payload:title::STRING)
    END AS body,
    CASE e.source
        WHEN 'commit' THEN COALESCE(e.payload:stats:total::NUMBER, 0)
        ELSE 0
    END AS lines_changed,
    CASE e.source
        WHEN 'pr' THEN e.payload:merged_at IS NOT NULL
        ELSE FALSE
    END AS is_merged,
    CASE e.source
        WHEN 'pr' THEN COALESCE(e.payload:review_comments::NUMBER, 0)
        ELSE 0
    END AS review_comments_count,
    e.payload
FROM GHOST_MAINTAINER.ANALYTICS.RAW_GITHUB_EVENTS e;
*/
