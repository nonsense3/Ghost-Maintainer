-- ============================================================================
-- 05_risk_score.sql — PRD §6: Final Combined Hijack / Burnout Risk Score View
-- Risk = 0.5 * Linguistic Score + 0.5 * Velocity Score
-- Low (0-33), Medium (34-66), High (67-100)
-- ============================================================================

CREATE OR REPLACE VIEW public.view_combined_repository_risk AS
WITH weekly_linguistic AS (
    SELECT
        repository_id,
        DATE_TRUNC('week', scored_at)::date AS week_start,
        ROUND(AVG(risk_score))::smallint AS linguistic_score,
        COUNT(*) AS comments_analyzed
    FROM public.comment_scores
    GROUP BY repository_id, DATE_TRUNC('week', scored_at)::date
),
all_signals AS (
    SELECT repository_id, week_start, signal_key, score FROM public.view_signal_activity_drop
    UNION ALL
    SELECT repository_id, week_start, signal_key, score FROM public.view_signal_commit_time_shift
    UNION ALL
    SELECT repository_id, week_start, signal_key, score FROM public.view_signal_new_author_surge
    UNION ALL
    SELECT repository_id, week_start, signal_key, score FROM public.view_signal_unreviewed_merges
    UNION ALL
    SELECT repository_id, week_start, signal_key, score FROM public.view_signal_reply_latency_spike
),
velocity_summary AS (
    SELECT
        repository_id,
        week_start,
        ROUND(AVG(score))::smallint AS velocity_score,
        JSONB_AGG(JSONB_BUILD_OBJECT('signal', signal_key, 'score', score)) AS signals_breakdown
    FROM all_signals
    GROUP BY repository_id, week_start
),
combined AS (
    SELECT
        COALESCE(l.repository_id, v.repository_id) AS repository_id,
        COALESCE(l.week_start, v.week_start) AS week_start,
        COALESCE(l.linguistic_score, 0)::smallint AS linguistic_score,
        COALESCE(v.velocity_score, 0)::smallint AS velocity_score,
        ROUND(
            0.5 * COALESCE(l.linguistic_score, 0) +
            0.5 * COALESCE(v.velocity_score, 0)
        )::smallint AS risk_score,
        COALESCE(v.signals_breakdown, '[]'::jsonb) AS signals_breakdown
    FROM velocity_summary v
    FULL OUTER JOIN weekly_linguistic l
        ON v.repository_id = l.repository_id AND v.week_start = l.week_start
)
SELECT
    r.id AS repository_id,
    r.full_name,
    c.week_start,
    c.linguistic_score,
    c.velocity_score,
    c.risk_score,
    CASE
        WHEN c.risk_score <= 33 THEN 'low'
        WHEN c.risk_score <= 66 THEN 'medium'
        ELSE 'high'
    END AS band,
    c.signals_breakdown
FROM combined c
JOIN public.repositories r ON c.repository_id = r.id;

COMMENT ON VIEW public.view_combined_repository_risk IS
    'PRD §6 combined maintainer risk score (0-100) and risk band categorization.';
