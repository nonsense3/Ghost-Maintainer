-- Ghost Maintainer — Migration: Behavioral Signal Views & Combined Risk Calculation

-- Drop dependent views cleanly to allow column schema updates in PostgreSQL
DROP VIEW IF EXISTS public.view_combined_repository_risk CASCADE;
DROP VIEW IF EXISTS public.view_signal_activity_drop CASCADE;
DROP VIEW IF EXISTS public.view_signal_commit_time_shift CASCADE;
DROP VIEW IF EXISTS public.view_signal_new_author_surge CASCADE;
DROP VIEW IF EXISTS public.view_signal_unreviewed_merges CASCADE;
DROP VIEW IF EXISTS public.view_signal_reply_latency_spike CASCADE;
DROP VIEW IF EXISTS public.github_events_flat CASCADE;

-- Step 1: Create normalized flatten view
CREATE VIEW public.github_events_flat AS
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

CREATE VIEW public.view_signal_activity_drop AS
WITH weekly_counts AS (
    SELECT
        repository_id,
        DATE_TRUNC('week', occurred_at)::date AS week_start,
        COUNT(*) AS weekly_events
    FROM public.github_events_flat
    WHERE source IN ('commit', 'pr')
    GROUP BY repository_id, DATE_TRUNC('week', occurred_at)::date
),
moving_averages AS (
    SELECT
        repository_id,
        week_start,
        weekly_events,
        AVG(weekly_events) OVER (
            PARTITION BY repository_id
            ORDER BY week_start
            ROWS BETWEEN 12 PRECEDING AND 1 PRECEDING
        ) AS baseline_90d_avg
    FROM weekly_counts
)
SELECT
    repository_id,
    week_start,
    'activity_drop' AS signal_key,
    CASE
        WHEN baseline_90d_avg IS NULL OR baseline_90d_avg = 0 THEN 0
        WHEN weekly_events >= baseline_90d_avg THEN 0
        ELSE LEAST(100, GREATEST(0, ROUND((1.0 - (weekly_events::numeric / baseline_90d_avg)) * 100)))::smallint
    END AS score,
    JSONB_BUILD_OBJECT(
        'current_weekly', weekly_events,
        'baseline_90d_avg', ROUND(COALESCE(baseline_90d_avg, 0)::numeric, 2)
    ) AS detail
FROM moving_averages;

CREATE VIEW public.view_signal_commit_time_shift AS
WITH commit_hours AS (
    SELECT
        repository_id,
        occurred_at,
        EXTRACT(HOUR FROM occurred_at)::integer AS commit_hour,
        CASE
            WHEN occurred_at >= NOW() - INTERVAL '30 days' THEN 'recent'
            WHEN occurred_at >= NOW() - INTERVAL '120 days' THEN 'baseline'
            ELSE 'older'
        END AS window_bucket
    FROM public.github_events_flat
    WHERE source = 'commit'
),
hour_counts AS (
    SELECT
        repository_id,
        window_bucket,
        commit_hour,
        COUNT(*) AS cnt
    FROM commit_hours
    WHERE window_bucket IN ('recent', 'baseline')
    GROUP BY repository_id, window_bucket, commit_hour
),
totals AS (
    SELECT
        repository_id,
        window_bucket,
        SUM(cnt) AS total_commits
    FROM hour_counts
    GROUP BY repository_id, window_bucket
),
proportions AS (
    SELECT
        h.repository_id,
        h.window_bucket,
        h.commit_hour,
        h.cnt::numeric / NULLIF(t.total_commits, 0) AS p
    FROM hour_counts h
    JOIN totals t ON h.repository_id = t.repository_id AND h.window_bucket = t.window_bucket
),
drift AS (
    SELECT
        COALESCE(r.repository_id, b.repository_id) AS repository_id,
        SUM(ABS(COALESCE(r.p, 0) - COALESCE(b.p, 0))) AS l1_drift
    FROM (SELECT * FROM proportions WHERE window_bucket = 'recent') r
    FULL OUTER JOIN (SELECT * FROM proportions WHERE window_bucket = 'baseline') b
        ON r.repository_id = b.repository_id AND r.commit_hour = b.commit_hour
    GROUP BY COALESCE(r.repository_id, b.repository_id)
)
SELECT
    repository_id,
    CURRENT_DATE AS week_start,
    'commit_time_shift' AS signal_key,
    LEAST(100, GREATEST(0, ROUND(COALESCE(l1_drift, 0) * 50)))::smallint AS score,
    JSONB_BUILD_OBJECT('l1_distance', ROUND(COALESCE(l1_drift, 0)::numeric, 4)) AS detail
FROM drift;

CREATE VIEW public.view_signal_new_author_surge AS
WITH author_first_commit AS (
    SELECT
        repository_id,
        author,
        MIN(occurred_at) AS first_seen_at
    FROM public.github_events_flat
    WHERE source = 'commit' AND author IS NOT NULL
    GROUP BY repository_id, author
),
recent_commits AS (
    SELECT
        c.repository_id,
        c.author,
        c.occurred_at,
        a.first_seen_at >= (NOW() - INTERVAL '30 days') AS is_new_author
    FROM public.github_events_flat c
    JOIN author_first_commit a ON c.repository_id = a.repository_id AND c.author = a.author
    WHERE c.source = 'commit' AND c.occurred_at >= (NOW() - INTERVAL '30 days')
)
SELECT
    repository_id,
    CURRENT_DATE AS week_start,
    'new_author_surge' AS signal_key,
    CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE LEAST(100, GREATEST(0, ROUND(
            (COUNT(*) FILTER (WHERE is_new_author)::numeric / COUNT(*)) * 100
        )))::smallint
    END AS score,
    JSONB_BUILD_OBJECT(
        'total_recent_commits', COUNT(*),
        'new_author_commits', COUNT(*) FILTER (WHERE is_new_author),
        'new_authors_count', COUNT(DISTINCT author) FILTER (WHERE is_new_author)
    ) AS detail
FROM recent_commits
GROUP BY repository_id;

CREATE VIEW public.view_signal_unreviewed_merges AS
WITH recent_prs AS (
    SELECT
        repository_id,
        event_id,
        (payload ->> 'merged_at') IS NOT NULL AS is_merged,
        COALESCE((payload ->> 'review_comments')::integer, 0) AS review_comments_count,
        COALESCE(body, '') ILIKE '%review%' AS mention_review
    FROM public.github_events_flat
    WHERE source = 'pr'
      AND occurred_at >= (NOW() - INTERVAL '30 days')
      AND (payload ->> 'merged_at') IS NOT NULL
)
SELECT
    repository_id,
    CURRENT_DATE AS week_start,
    'unreviewed_merges' AS signal_key,
    CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE LEAST(100, GREATEST(0, ROUND(
            (COUNT(*) FILTER (WHERE review_comments_count = 0 AND NOT mention_review)::numeric / COUNT(*)) * 100
        )))::smallint
    END AS score,
    JSONB_BUILD_OBJECT(
        'merged_prs_last_30d', COUNT(*),
        'unreviewed_count', COUNT(*) FILTER (WHERE review_comments_count = 0 AND NOT mention_review)
    ) AS detail
FROM recent_prs
GROUP BY repository_id;

CREATE VIEW public.view_signal_reply_latency_spike AS
WITH issue_first_replies AS (
    SELECT
        i.repository_id,
        i.event_id AS issue_event_id,
        i.occurred_at AS issue_created_at,
        MIN(c.occurred_at) AS first_reply_at,
        EXTRACT(EPOCH FROM (MIN(c.occurred_at) - i.occurred_at)) / 3600.0 AS reply_delay_hours
    FROM public.github_events_flat i
    JOIN public.github_events_flat c
        ON i.repository_id = c.repository_id
        AND c.source = 'comment'
        AND c.occurred_at >= i.occurred_at
        AND (c.payload ->> 'issue_number') = (i.payload ->> 'number')
    WHERE i.source = 'issue'
    GROUP BY i.repository_id, i.event_id, i.occurred_at
),
latency_windows AS (
    SELECT
        repository_id,
        AVG(reply_delay_hours) FILTER (WHERE issue_created_at >= NOW() - INTERVAL '30 days') AS recent_avg_hours,
        AVG(reply_delay_hours) FILTER (WHERE issue_created_at >= NOW() - INTERVAL '120 days' AND issue_created_at < NOW() - INTERVAL '30 days') AS baseline_avg_hours,
        STDDEV(reply_delay_hours) FILTER (WHERE issue_created_at >= NOW() - INTERVAL '120 days') AS baseline_stddev
    FROM issue_first_replies
    GROUP BY repository_id
)
SELECT
    repository_id,
    CURRENT_DATE AS week_start,
    'reply_latency_spike' AS signal_key,
    CASE
        WHEN recent_avg_hours IS NULL OR baseline_avg_hours IS NULL OR baseline_avg_hours = 0 THEN 0
        WHEN recent_avg_hours <= baseline_avg_hours THEN 0
        ELSE LEAST(100, GREATEST(0, ROUND(
            LEAST(4.0, (recent_avg_hours - baseline_avg_hours) / NULLIF(COALESCE(baseline_stddev, baseline_avg_hours), 0)) * 25
        )))::smallint
    END AS score,
    JSONB_BUILD_OBJECT(
        'recent_avg_hours', ROUND(COALESCE(recent_avg_hours, 0)::numeric, 1),
        'baseline_avg_hours', ROUND(COALESCE(baseline_avg_hours, 0)::numeric, 1)
    ) AS detail
FROM latency_windows;
