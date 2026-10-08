import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "..", "web", "package.json"));
const snowflake = require("snowflake-sdk");

console.log("[*] Connecting to Snowflake...");
console.log("    Account:  ", process.env.SNOWFLAKE_ACCOUNT);
console.log("    User:     ", process.env.SNOWFLAKE_USER);
console.log("    Warehouse:", process.env.SNOWFLAKE_WAREHOUSE);

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
});

function runSql(conn, sqlText) {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) reject(err);
        else resolve(rows);
      },
    });
  });
}

connection.connect(async (err, conn) => {
  if (err) {
    console.error("[-] Snowflake connection failed:", err.message);
    process.exit(1);
  }
  console.log("[+] Snowflake connected! ID:", conn.getId());

  const ddlStatements = [
    "CREATE DATABASE IF NOT EXISTS GHOST_MAINTAINER",
    "USE DATABASE GHOST_MAINTAINER",
    "CREATE SCHEMA IF NOT EXISTS ANALYTICS",
    "USE SCHEMA ANALYTICS",
    `CREATE TABLE IF NOT EXISTS repositories (
      id VARCHAR(36) PRIMARY KEY,
      owner VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      full_name VARCHAR(512) NOT NULL,
      default_branch VARCHAR(100) DEFAULT 'main',
      created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )`,
    `CREATE TABLE IF NOT EXISTS raw_github_events (
      id NUMBER AUTOINCREMENT PRIMARY KEY,
      repository_id VARCHAR(36) NOT NULL,
      source VARCHAR(20) NOT NULL,
      external_id VARCHAR(100) NOT NULL,
      occurred_at TIMESTAMP_NTZ NOT NULL,
      payload VARIANT NOT NULL,
      ingested_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )`,
    `CREATE TABLE IF NOT EXISTS comment_scores (
      id NUMBER AUTOINCREMENT PRIMARY KEY,
      repository_id VARCHAR(36) NOT NULL,
      risk_score NUMBER(5, 2) NOT NULL,
      signals VARIANT NOT NULL,
      reason VARCHAR(1000),
      model VARCHAR(100) DEFAULT 'gemma4:31b-cloud',
      scored_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )`,
    `CREATE TABLE IF NOT EXISTS behavior_signals (
      id NUMBER AUTOINCREMENT PRIMARY KEY,
      repository_id VARCHAR(36) NOT NULL,
      signal_key VARCHAR(100) NOT NULL,
      value_num NUMBER(10, 4),
      value_json VARIANT,
      drift_flag BOOLEAN DEFAULT FALSE,
      calculated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )`,
    `CREATE TABLE IF NOT EXISTS risk_scores (
      id NUMBER AUTOINCREMENT PRIMARY KEY,
      repository_id VARCHAR(36) NOT NULL,
      risk_score NUMBER(5, 2) NOT NULL,
      band VARCHAR(20) NOT NULL,
      signals_count NUMBER DEFAULT 0,
      calculated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
    )`
  ];

  try {
    for (const sql of ddlStatements) {
      console.log("[*] Executing:", sql.split("\n")[0]);
      await runSql(conn, sql);
    }
    console.log("[✓] GHOST_MAINTAINER.ANALYTICS database and tables successfully created in Snowflake!");
  } catch (ex) {
    console.error("[-] Error running Snowflake DDL:", ex.message);
  } finally {
    conn.destroy();
  }
});
