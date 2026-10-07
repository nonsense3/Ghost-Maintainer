import "server-only";
import { getServerEnv } from "@/lib/env/server";

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
    warehouse: env.SNOWFLAKE_WAREHOUSE,
    database: env.SNOWFLAKE_DATABASE,
    schema: env.SNOWFLAKE_SCHEMA,
    isConfigured: Boolean(account && user && password),
  };
}

/**
 * Generates ready-to-run Snowflake zero-egress SQL statements for a repository dataset.
 */
export function generateSnowflakeCopySql(repoFullName: string, sampleDataJson: string): string {
  const config = getSnowflakeConfig();
  return `-- ============================================================================
-- Snowflake Zero-Egress Ingestion Script for ${repoFullName}
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
    'evt-${Date.now()}',
    CURRENT_TIMESTAMP(),
    PARSE_JSON('${sampleDataJson.replace(/'/g, "''")}')
FROM repositories r
WHERE r.full_name = '${repoFullName}';
`;
}
