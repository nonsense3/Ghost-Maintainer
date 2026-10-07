-- ============================================================================
-- 03_cortex_scoring.sql — PRD Track 1 & Track 3: Gemma Linguistic Scoring via SQL
-- Demonstrates zero-egress LLM execution inside Snowflake Cortex AI
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SNOWFLAKE CORTEX AI BATCH SCORING
-- ----------------------------------------------------------------------------
/*
USE DATABASE GHOST_MAINTAINER;
USE SCHEMA ANALYTICS;

-- Stored Procedure or Batch Query to score unscored comments using Gemma in Cortex
CREATE OR REPLACE PROCEDURE SCORE_UNSCORED_COMMENTS(batch_limit NUMBER)
RETURNS STRING
LANGUAGE SQL
AS
$$
DECLARE
    scored_count NUMBER DEFAULT 0;
BEGIN
    INSERT INTO GHOST_MAINTAINER.ANALYTICS.COMMENT_SCORES (
        repository_id,
        event_id,
        risk_score,
        signals,
        reason,
        model,
        scored_at
    )
    WITH unscored_items AS (
        SELECT
            e.id AS event_id,
            e.repository_id,
            e.source,
            e.body AS raw_text
        FROM GHOST_MAINTAINER.ANALYTICS.GITHUB_EVENTS_FLAT e
        LEFT JOIN GHOST_MAINTAINER.ANALYTICS.COMMENT_SCORES s
            ON e.id = s.event_id
        WHERE s.id IS NULL
          AND e.source IN ('comment', 'issue')
          AND LENGTH(TRIM(e.body)) >= 15
        ORDER BY e.occurred_at DESC
        LIMIT :batch_limit
    ),
    cortex_eval AS (
        SELECT
            u.event_id,
            u.repository_id,
            SNOWFLAKE.CORTEX.COMPLETE(
                'gemma-7b',
                CONCAT(
                    'You assess open-source maintainer burnout and hijack risk from a single GitHub comment or issue body.\n',
                    'Compare tone to a tired but honest maintainer vs a hostile takeover. Output valid JSON only: ',
                    '{"risk_score":0-100,"signals":["..."],"reason":"one sentence"}\n',
                    'Look for: frustration, "I need help maintaining", sudden style change, pushy new contributors, vague urgency.\n\n',
                    'Input text:\n',
                    SUBSTRING(u.raw_text, 1, 4000)
                )
            ) AS response_text
        FROM unscored_items u
    ),
    parsed AS (
        SELECT
            c.event_id,
            c.repository_id,
            TRY_PARSE_JSON(
                REGEXP_SUBSTR(c.response_text, '\\{[^\\}]*\\}')
            ) AS payload_json
        FROM cortex_eval c
    )
    SELECT
        p.repository_id,
        p.event_id,
        COALESCE(p.payload_json:risk_score::NUMBER, 0) AS risk_score,
        COALESCE(p.payload_json:signals, PARSE_JSON('[]')) AS signals,
        COALESCE(p.payload_json:reason::STRING, 'Evaluated by Cortex Gemma') AS reason,
        'snowflake-cortex-gemma-7b' AS model,
        CURRENT_TIMESTAMP() AS scored_at
    FROM parsed p
    WHERE p.payload_json IS NOT NULL;

    scored_count := SQLROWCOUNT;
    RETURN 'Successfully scored ' || scored_count || ' comments using Snowflake Cortex Gemma.';
END;
$$;
*/

-- ----------------------------------------------------------------------------
-- POSTGRESQL / SUPABASE EQUIVALENT (Edge AI / Local Ollama Batching Interface)
-- ----------------------------------------------------------------------------
-- Comments awaiting Gemma evaluation can be fetched by the application or
-- pg_net / pg_ai worker via this view:
CREATE OR REPLACE VIEW public.comments_pending_scoring AS
SELECT
    e.event_id,
    e.repository_id,
    e.source,
    e.occurred_at,
    e.author,
    e.body
FROM public.github_events_flat e
LEFT JOIN public.comment_scores s ON e.event_id = s.event_id
WHERE s.id IS NULL
  AND e.source IN ('comment', 'issue')
  AND LENGTH(TRIM(e.body)) >= 15
ORDER BY e.occurred_at DESC;

COMMENT ON VIEW public.comments_pending_scoring IS
    'Candidate comments and issue descriptions queued for Gemma 2 (Ollama / Cortex) linguistic analysis.';
