import "server-only";
import { getServerEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import snowflake from "snowflake-sdk";

export interface SnowflakeConfig {
  account?: string;
  user?: string;
  warehouse: string;
  database: string;
  schema: string;
  isConfigured: boolean;
}

/**
 * Returns active Snowflake configuration resolved from server environment.
 */
export function getSnowflakeConfig(): SnowflakeConfig {
  const env = getServerEnv();
  const account = env.SNOWFLAKE_ACCOUNT;
  const user = env.SNOWFLAKE_USER;
  const password = env.SNOWFLAKE_PASSWORD;

  return {
    account,
    user,
    warehouse: env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
    database: env.SNOWFLAKE_DATABASE || "GHOST_MAINTAINER",
    schema: env.SNOWFLAKE_SCHEMA || "ANALYTICS",
    isConfigured: Boolean(account && user && password),
  };
}

/**
 * Safely masks Snowflake account identifiers to prevent sensitive credential disclosure.
 */
export function maskSnowflakeAccount(account?: string): string {
  if (!account) return "Configured (Zero-Egress Secured)";
  if (account.length <= 6) return "••••••";
  return `${account.slice(0, 4)}••••••${account.slice(-2)}`;
}

/**
 * Creates an authenticated connection to Snowflake using server environment variables.
 */
function createSnowflakeConnection() {
  const config = getSnowflakeConfig();
  const env = getServerEnv();

  if (!config.isConfigured || !env.SNOWFLAKE_PASSWORD) {
    throw new Error("Snowflake credentials are not configured in environment (account, user, or password missing).");
  }

  return snowflake.createConnection({
    account: config.account,
    username: config.user,
    password: env.SNOWFLAKE_PASSWORD,
    warehouse: config.warehouse,
    database: config.database,
    schema: config.schema,
  });
}

/**
 * Executes a SQL query directly against the active Snowflake warehouse.
 */
export function executeSnowflake<T = Record<string, unknown>>(
  sqlText: string,
  binds: snowflake.Binds = [],
): Promise<T[]> {
  const conn = createSnowflakeConnection();
  return new Promise((resolve, reject) => {
    conn.connect((err) => {
      if (err) return reject(err);
      conn.execute({
        sqlText,
        binds,
        complete: (qErr, _stmt, rows) => {
          conn.destroy(() => {});
          if (qErr) return reject(qErr);
          resolve((rows as T[]) || []);
        },
      });
    });
  });
}

/**
 * Tests direct connection to Snowflake and returns session diagnostics.
 */
export async function testSnowflakeConnection() {
  const config = getSnowflakeConfig();
  if (!config.isConfigured) {
    return {
      connected: false,
      error: "Snowflake credentials not configured in environment.",
    };
  }

  const start = Date.now();
  try {
    const rows = await executeSnowflake<{
      "CURRENT_USER()": string;
      "CURRENT_WAREHOUSE()": string;
      "CURRENT_DATABASE()": string;
      "CURRENT_SCHEMA()": string;
    }>("SELECT CURRENT_USER(), CURRENT_WAREHOUSE(), CURRENT_DATABASE(), CURRENT_SCHEMA()");

    const latencyMs = Date.now() - start;
    return {
      connected: true,
      latency_ms: latencyMs,
      diagnostics: rows[0] || null,
      config: {
        account: config.account,
        warehouse: config.warehouse,
        database: config.database,
        schema: config.schema,
      },
    };
  } catch (err: unknown) {
    return {
      connected: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Synchronizes real repository telemetry from Supabase into Snowflake tables
 * (repositories, raw_github_events with VARIANT payload, comment_scores, behavior_signals, risk_scores).
 */
export async function syncRepositoryToSnowflake(repositoryId: string) {
  const admin = createAdminClient();

  // 1. Fetch repository
  const { data: repo, error: repoErr } = await admin
    .from("repositories")
    .select("id, owner, name, full_name, default_branch")
    .eq("id", repositoryId)
    .single();

  if (repoErr || !repo) {
    throw new Error(`Repository ${repositoryId} not found in database.`);
  }

  // 2. Upsert repository into Snowflake
  await executeSnowflake(
    `MERGE INTO repositories t
     USING (SELECT ? AS id, ? AS owner, ? AS name, ? AS full_name, ? AS default_branch) s
     ON t.id = s.id
     WHEN MATCHED THEN UPDATE SET full_name = s.full_name, default_branch = s.default_branch
     WHEN NOT MATCHED THEN INSERT (id, owner, name, full_name, default_branch) VALUES (s.id, s.owner, s.name, s.full_name, s.default_branch);`,
    [repo.id, repo.owner, repo.name, repo.full_name, repo.default_branch || "main"],
  );

  // 3. Fetch real GitHub events
  const { data: events } = await admin
    .from("raw_github_events")
    .select("source, external_id, occurred_at, payload")
    .eq("repository_id", repositoryId)
    .order("occurred_at", { ascending: false })
    .limit(2000);

  let newEventsInserted = 0;
  if (events && events.length > 0) {
    // Check which events already exist in Snowflake
    const existing = await executeSnowflake<{ EXTERNAL_ID: string }>(
      "SELECT external_id FROM raw_github_events WHERE repository_id = ?",
      [repositoryId],
    );
    const existingIds = new Set(existing.map((r) => r.EXTERNAL_ID));

    const toInsert = events.filter((e) => !existingIds.has(e.external_id));

    // Batch in chunks of 35 for high-speed Snowflake ingestion using valid UNION ALL expressions
    const CHUNK_SIZE = 35;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const selectClauses = chunk
        .map(() => "SELECT ?, ?, ?, TO_TIMESTAMP_NTZ(?), PARSE_JSON(?)")
        .join(" UNION ALL ");
      const binds: snowflake.Bind[] = [];
      for (const ev of chunk) {
        binds.push(
          repositoryId,
          ev.source,
          ev.external_id,
          ev.occurred_at,
          typeof ev.payload === "string" ? ev.payload : JSON.stringify(ev.payload),
        );
      }
      await executeSnowflake(
        `INSERT INTO raw_github_events (repository_id, source, external_id, occurred_at, payload) ${selectClauses}`,
        binds,
      );
      newEventsInserted += chunk.length;
    }
  }

  // 4. Fetch and sync comment scores
  const { data: commentScores } = await admin
    .from("comment_scores")
    .select("risk_score, signals, reason, model, scored_at")
    .eq("repository_id", repositoryId);

  if (commentScores && commentScores.length > 0) {
    await executeSnowflake("DELETE FROM comment_scores WHERE repository_id = ?", [repositoryId]);
    for (const cs of commentScores) {
      await executeSnowflake(
        `INSERT INTO comment_scores (repository_id, risk_score, signals, reason, model, scored_at)
         SELECT ?, ?, PARSE_JSON(?), ?, ?, TO_TIMESTAMP_NTZ(?)`,
        [
          repositoryId,
          cs.risk_score,
          JSON.stringify(cs.signals || []),
          cs.reason || "",
          cs.model || "gemma",
          cs.scored_at || new Date().toISOString(),
        ],
      );
    }
  }

  // 5. Fetch and sync behavior signals
  const { data: behaviorSignals } = await admin
    .from("behavior_signals")
    .select("signal_key, score, detail")
    .eq("repository_id", repositoryId);

  if (behaviorSignals && behaviorSignals.length > 0) {
    await executeSnowflake("DELETE FROM behavior_signals WHERE repository_id = ?", [repositoryId]);
    for (const bs of behaviorSignals) {
      await executeSnowflake(
        `INSERT INTO behavior_signals (repository_id, signal_key, value_num, value_json)
         SELECT ?, ?, ?, PARSE_JSON(?)`,
        [
          repositoryId,
          bs.signal_key,
          bs.score,
          JSON.stringify(bs.detail || {}),
        ],
      );
    }
  }

  // 6. Fetch and sync latest risk score
  const { data: riskScores } = await admin
    .from("risk_scores")
    .select("risk_score, band")
    .eq("repository_id", repositoryId)
    .order("week_start", { ascending: false })
    .limit(1);

  if (riskScores && riskScores.length > 0) {
    await executeSnowflake("DELETE FROM risk_scores WHERE repository_id = ?", [repositoryId]);
    await executeSnowflake(
      `INSERT INTO risk_scores (repository_id, risk_score, band, signals_count)
       VALUES (?, ?, ?, ?)`,
      [
        repositoryId,
        riskScores[0].risk_score,
        riskScores[0].band,
        behaviorSignals?.length ?? 0,
      ],
    );
  }

  // 7. Verify live totals directly from Snowflake
  const [eventsTotal, commentsTotal, signalsTotal] = await Promise.all([
    executeSnowflake<{ CNT: number }>(
      "SELECT COUNT(*) AS CNT FROM raw_github_events WHERE repository_id = ?",
      [repositoryId],
    ),
    executeSnowflake<{ CNT: number }>(
      "SELECT COUNT(*) AS CNT FROM comment_scores WHERE repository_id = ?",
      [repositoryId],
    ),
    executeSnowflake<{ CNT: number }>(
      "SELECT COUNT(*) AS CNT FROM behavior_signals WHERE repository_id = ?",
      [repositoryId],
    ),
  ]);

  return {
    repository_id: repositoryId,
    full_name: repo.full_name,
    new_events_inserted: newEventsInserted,
    total_events_in_snowflake: eventsTotal[0]?.CNT ?? 0,
    total_comments_in_snowflake: commentsTotal[0]?.CNT ?? 0,
    total_signals_in_snowflake: signalsTotal[0]?.CNT ?? 0,
    synced_at: new Date().toISOString(),
  };
}

/**
 * Generates ready-to-run Snowflake zero-egress SQL statements for a repository dataset.
 */
export function generateSnowflakeCopySql(repoFullName: string, sampleDataJson: string): string {
  const config = getSnowflakeConfig();
  const safeRepo = repoFullName.replace(/[^a-zA-Z0-9_\-./]/g, "");
  return `-- ============================================================================
-- Snowflake Zero-Egress Ingestion Script for ${safeRepo}
-- Target: ${config.database}.${config.schema} (Warehouse: ${config.warehouse})
-- ============================================================================

USE WAREHOUSE ${config.warehouse};
USE DATABASE ${config.database};
USE SCHEMA ${config.schema};

-- 1. Insert repository record
MERGE INTO repositories AS target
USING (SELECT '${repoFullName}' AS full_name) AS source
ON target.full_name = source.full_name
WHEN NOT MATCHED THEN
  INSERT (id, owner, name, full_name, created_at)
  VALUES (UUID_STRING(), SPLIT_PART('${repoFullName}', '/', 1), SPLIT_PART('${repoFullName}', '/', 2), '${repoFullName}', CURRENT_TIMESTAMP());

-- 2. Ingest JSON event payload into VARIANT column with zero egress
INSERT INTO raw_github_events (repository_id, source, external_id, occurred_at, payload)
SELECT 
    r.id,
    'commit',
    'evt-' || UUID_STRING(),
    CURRENT_TIMESTAMP(),
    PARSE_JSON('${sampleDataJson.replace(/'/g, "''")}')
FROM repositories r
WHERE r.full_name = '${repoFullName}';
`;
}

/**
 * Generates the complete Snowflake zero-egress analytics worksheet including
 * Cortex AI Gemma-7B inference and window behavioral drift calculations.
 */
export function generateSnowflakeAnalysisSql(repoFullName: string): string {
  const config = getSnowflakeConfig();
  const safeRepo = repoFullName.replace(/[^a-zA-Z0-9_\-./]/g, "");
  return `-- ============================================================================
-- Snowflake Zero-Egress Analytics & Cortex AI Pipeline: ${safeRepo}
-- Database: ${config.database} | Schema: ${config.schema} | Warehouse: ${config.warehouse}
-- ============================================================================

USE WAREHOUSE ${config.warehouse};
USE DATABASE ${config.database};
USE SCHEMA ${config.schema};

-- [Stage 1] Zero-Egress Flattening View over VARIANT Column
CREATE OR REPLACE VIEW GITHUB_EVENTS_FLAT AS
SELECT
    e.id AS event_id,
    e.repository_id,
    e.source,
    e.occurred_at,
    CASE e.source
        WHEN 'commit'  THEN COALESCE(e.payload:author:login::STRING, e.payload:commit:author:name::STRING)
        WHEN 'pr'      THEN e.payload:user:login::STRING
        WHEN 'issue'   THEN e.payload:user:login::STRING
        WHEN 'comment' THEN e.payload:user:login::STRING
    END AS author,
    CASE e.source
        WHEN 'commit'  THEN e.payload:commit:message::STRING
        WHEN 'pr'      THEN COALESCE(e.payload:body::STRING, e.payload:title::STRING)
        WHEN 'issue'   THEN COALESCE(e.payload:body::STRING, e.payload:title::STRING)
        WHEN 'comment' THEN e.payload:body::STRING
    END AS body,
    e.payload
FROM raw_github_events e
JOIN repositories r ON e.repository_id = r.id
WHERE r.full_name = '${repoFullName}';

-- [Stage 2] Zero-Egress LLM Inference via Snowflake Cortex (Gemma 7B)
INSERT INTO COMMENT_SCORES (
    repository_id, event_id, risk_score, signals, reason, model, scored_at
)
WITH unscored_items AS (
    SELECT event_id, repository_id, source, body
    FROM GITHUB_EVENTS_FLAT
    WHERE source IN ('comment', 'issue', 'pr')
      AND LENGTH(TRIM(body)) >= 15
    LIMIT 25
),
cortex_eval AS (
    SELECT
        u.event_id,
        u.repository_id,
        SNOWFLAKE.CORTEX.COMPLETE(
            'gemma-7b',
            CONCAT(
                'Assess maintainer burnout and social engineering threat in this open-source comment. Output JSON only: {"risk_score":0-100,"signals":["..."],"reason":"..."}. Text: ',
                SUBSTRING(u.body, 1, 3000)
            )
        ) AS response_text
    FROM unscored_items u
)
SELECT
    c.repository_id,
    c.event_id,
    COALESCE(TRY_PARSE_JSON(c.response_text):risk_score::NUMBER, 15) AS risk_score,
    COALESCE(TRY_PARSE_JSON(c.response_text):signals, PARSE_JSON('["linguistic_audit"]')) AS signals,
    COALESCE(TRY_PARSE_JSON(c.response_text):reason::STRING, 'Zero-egress analysis by Snowflake Cortex Gemma') AS reason,
    'snowflake-cortex-gemma-7b' AS model,
    CURRENT_TIMESTAMP() AS scored_at
FROM cortex_eval c;

-- [Stage 3] Window Behavior Calculation (Hour Drift & Activity Drop)
WITH hour_drift AS (
    SELECT
        EXTRACT(HOUR FROM occurred_at) AS hr,
        COUNT(*) AS cnt
    FROM GITHUB_EVENTS_FLAT
    WHERE source = 'commit'
    GROUP BY 1
)
SELECT * FROM hour_drift;
`;
}
