import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "..", "web", "package.json"));
const snowflake = require("snowflake-sdk");
const { createClient } = require("@supabase/supabase-js");

console.log("[*] Initializing Snowflake Live Test...");

const sb = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const conn = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
  database: process.env.SNOWFLAKE_DATABASE || "GHOST_MAINTAINER",
  schema: process.env.SNOWFLAKE_SCHEMA || "ANALYTICS",
});

function runSql(sqlText, binds = []) {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) reject(err);
        else resolve(rows);
      },
    });
  });
}

conn.connect(async (err) => {
  if (err) {
    console.error("[-] Snowflake connection failed:", err.message);
    process.exit(1);
  }
  console.log("[+] Snowflake connected!");

  try {
    // 1. Diagnostics check
    const diag = await runSql("SELECT CURRENT_USER(), CURRENT_WAREHOUSE(), CURRENT_DATABASE(), CURRENT_SCHEMA()");
    console.log("[+] Session diagnostics:", diag[0]);

    // 2. Fetch real repos from Supabase
    const { data: repos, error: reposErr } = await sb.from("repositories").select("*");
    if (reposErr) throw reposErr;
    console.log(`[+] Found ${repos.length} real repository/repositories in Supabase:`);

    for (const repo of repos) {
      console.log(`\n[*] Processing real repo: ${repo.full_name} (${repo.id})...`);

      // Merge repo into Snowflake
      await runSql(
        `MERGE INTO repositories t
         USING (SELECT ? AS id, ? AS owner, ? AS name, ? AS full_name, ? AS default_branch) s
         ON t.id = s.id
         WHEN MATCHED THEN UPDATE SET full_name = s.full_name, default_branch = s.default_branch
         WHEN NOT MATCHED THEN INSERT (id, owner, name, full_name, default_branch) VALUES (s.id, s.owner, s.name, s.full_name, s.default_branch);`,
        [repo.id, repo.owner, repo.name, repo.full_name, repo.default_branch || "main"]
      );
      console.log(`    [✓] Merged repository into Snowflake.`);

      // Sync real events
      const { data: events, error: evErr } = await sb
        .from("raw_github_events")
        .select("source, external_id, occurred_at, payload")
        .eq("repository_id", repo.id);
      if (evErr) throw evErr;

      console.log(`    [*] Syncing ${events?.length || 0} real events to Snowflake VARIANT column...`);
      if (events && events.length > 0) {
        const existingRows = await runSql(
          "SELECT external_id FROM raw_github_events WHERE repository_id = ?",
          [repo.id]
        );
        const existing = new Set(existingRows.map((r) => r.EXTERNAL_ID));
        let inserted = 0;

        for (const ev of events) {
          if (!existing.has(ev.external_id)) {
            await runSql(
              `INSERT INTO raw_github_events (repository_id, source, external_id, occurred_at, payload)
               SELECT ?, ?, ?, TO_TIMESTAMP_NTZ(?), PARSE_JSON(?)`,
              [
                repo.id,
                ev.source,
                ev.external_id,
                ev.occurred_at,
                typeof ev.payload === "string" ? ev.payload : JSON.stringify(ev.payload),
              ]
            );
            inserted++;
          }
        }
        console.log(`    [✓] Inserted ${inserted} new events (${existing.size} already existed).`);
      }

      // Sync real comment scores
      const { data: scores } = await sb
        .from("comment_scores")
        .select("risk_score, signals, reason, model, scored_at")
        .eq("repository_id", repo.id);

      if (scores && scores.length > 0) {
        await runSql("DELETE FROM comment_scores WHERE repository_id = ?", [repo.id]);
        for (const cs of scores) {
          await runSql(
            `INSERT INTO comment_scores (repository_id, risk_score, signals, reason, model, scored_at)
             SELECT ?, ?, PARSE_JSON(?), ?, ?, TO_TIMESTAMP_NTZ(?)`,
            [
              repo.id,
              cs.risk_score,
              JSON.stringify(cs.signals || []),
              cs.reason || "",
              cs.model || "gemma",
              cs.scored_at || new Date().toISOString(),
            ]
          );
        }
        console.log(`    [✓] Synced ${scores.length} comment score audits.`);
      }

      // Sync real behavior signals
      const { data: signals } = await sb
        .from("behavior_signals")
        .select("signal_key, score, detail")
        .eq("repository_id", repo.id);

      if (signals && signals.length > 0) {
        await runSql("DELETE FROM behavior_signals WHERE repository_id = ?", [repo.id]);
        for (const bs of signals) {
          await runSql(
            `INSERT INTO behavior_signals (repository_id, signal_key, value_num, value_json)
             SELECT ?, ?, ?, PARSE_JSON(?)`,
            [
              repo.id,
              bs.signal_key,
              bs.score,
              JSON.stringify(bs.detail || {}),
            ]
          );
        }
        console.log(`    [✓] Synced ${signals.length} behavior signals.`);
      }

      // Sync risk score
      const { data: riskRows } = await sb
        .from("risk_scores")
        .select("risk_score, band")
        .eq("repository_id", repo.id)
        .order("week_start", { ascending: false })
        .limit(1);

      if (riskRows && riskRows.length > 0) {
        await runSql("DELETE FROM risk_scores WHERE repository_id = ?", [repo.id]);
        await runSql(
          "INSERT INTO risk_scores (repository_id, risk_score, band, signals_count) VALUES (?, ?, ?, ?)",
          [repo.id, riskRows[0].risk_score, riskRows[0].band, signals?.length || 0]
        );
        console.log(`    [✓] Synced risk score: ${riskRows[0].risk_score} (${riskRows[0].band}).`);
      }

      // Verification queries directly on Snowflake
      const [evCnt, csCnt, bsCnt, rsCnt] = await Promise.all([
        runSql("SELECT COUNT(*) AS CNT FROM raw_github_events WHERE repository_id = ?", [repo.id]),
        runSql("SELECT COUNT(*) AS CNT FROM comment_scores WHERE repository_id = ?", [repo.id]),
        runSql("SELECT COUNT(*) AS CNT FROM behavior_signals WHERE repository_id = ?", [repo.id]),
        runSql("SELECT COUNT(*) AS CNT FROM risk_scores WHERE repository_id = ?", [repo.id]),
      ]);

      console.log(`    [✓] Verified Snowflake Counts for ${repo.full_name}:`);
      console.log(`        - Events in Snowflake:    ${evCnt[0].CNT}`);
      console.log(`        - Scored Comments:        ${csCnt[0].CNT}`);
      console.log(`        - Behavior Signals:       ${bsCnt[0].CNT}`);
      console.log(`        - Risk Scores:            ${rsCnt[0].CNT}`);
    }

    console.log("\n[=================================================================]");
    console.log("[✓] ALL REAL DATA SUCCESSFULLY SYNCED & VERIFIED IN SNOWFLAKE!");
    console.log("[=================================================================]\n");
  } catch (ex) {
    console.error("[-] Error during Snowflake live test:", ex);
  } finally {
    conn.destroy();
  }
});
