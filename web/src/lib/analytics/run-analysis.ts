import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env/server";
import { scoreTextWithGemma } from "@/lib/gemma/score";
import { getUserGitHubToken } from "@/lib/github/token";
import { githubFetch } from "@/lib/github/client";
import {
  combineRisk,
  computeBehaviorSignals,
} from "./behavior";
import { eventTextForScoring, flattenEvent, toSecurityScanTarget } from "./events";
import { syncRepositoryToSnowflake } from "@/lib/snowflake/client";

const SCORE_BATCH = 15;

function explainBehaviorSignal(signalKey: string, score: number): string {
  switch (signalKey) {
    case "activity_drop":
      return `Severe Maintenance Lull (Score ${score}/100): Zero commits observed in the last 30 days compared to historical baseline. Increases susceptibility to malicious hijacking window (PRD §5).`;
    case "commit_time_shift":
      return `Anomalous Commit Timing (Score ${score}/100): Author commit timestamps deviate significantly from historical working hours. Often observed during account credential theft (CVE-2024-3094, ua-parser-js).`;
    case "new_author_surge":
      return `Unvetted Contributor Surge (Score ${score}/100): Elevated volume of code merged by new authors without longstanding contributor history.`;
    case "unreviewed_merges":
      return `Unreviewed Pull Requests Merged (Score ${score}/100): Commits merged directly without multi-party code review or security review approvals.`;
    case "reply_latency_spike":
      return `Maintainer Responsiveness Drop (Score ${score}/100): Issue triage and review response latency spiked significantly over repository baseline.`;
    default:
      return `Behavior signal ${signalKey.replace(/_/g, " ")} evaluated at ${score}/100 against historical baseline.`;
  }
}

export async function runRepositoryAnalysis(repositoryId: string) {
  const admin = createAdminClient();

  // Fetch repository metadata
  const { data: repo } = await admin
    .from("repositories")
    .select("id, user_id, owner, name, full_name")
    .eq("id", repositoryId)
    .single();

  const userToken = repo ? await getUserGitHubToken(repo.user_id) : null;

  const { data: rawEvents, error } = await admin
    .from("raw_github_events")
    .select("id, source, external_id, occurred_at, payload")
    .eq("repository_id", repositoryId)
    .order("occurred_at", { ascending: false })
    .limit(2000);

  if (error) throw new Error(error.message);

  // Enrich commit events with files & diffs if missing
  if (repo && rawEvents) {
    let enrichedCount = 0;
    for (const ev of rawEvents) {
      if (enrichedCount >= 10) break;
      const p = ev.payload as Record<string, unknown>;
      if (ev.source === "commit" && (!p.files || !Array.isArray(p.files) || p.files.length === 0)) {
        try {
          const detail = await githubFetch<{
            files?: Array<{
              filename: string;
              status?: string;
              additions?: number;
              deletions?: number;
              patch?: string;
            }>;
          }>(`/repos/${repo.owner}/${repo.name}/commits/${ev.external_id}`, undefined, userToken);
          if (detail?.files && detail.files.length > 0) {
            const files = detail.files.slice(0, 10).map((f) => ({
              filename: f.filename,
              status: f.status,
              additions: f.additions,
              deletions: f.deletions,
              patch: f.patch ? f.patch.slice(0, 2000) : undefined,
            }));
            const updatedPayload = { ...p, files };
            ev.payload = updatedPayload;
            await admin.from("raw_github_events").update({ payload: updatedPayload }).eq("id", ev.id);
            enrichedCount++;
          }
        } catch {
          // Fallback if rate limited
        }
      }
    }
  }

  const flat = (rawEvents ?? []).map((e) =>
    flattenEvent({
      id: e.id,
      source: e.source,
      external_id: e.external_id,
      occurred_at: e.occurred_at,
      payload: e.payload as Record<string, unknown>,
    }),
  );

  const { data: existingScores } = await admin
    .from("comment_scores")
    .select("event_id, reason")
    .eq("repository_id", repositoryId);

  // Check which events have outdated generic demo strings or lack scores
  const genericReasons = new Set([
    "Routine bug fix or maintenance interaction.",
    "Nominal developer activity without anomalous stress patterns.",
    "Standard feature development commit or request.",
  ]);

  const existingMap = new Map((existingScores ?? []).map((s) => [s.event_id, s.reason]));
  const toScore = flat
    .filter((e) => {
      const existingReason = existingMap.get(e.id);
      const isOutdatedOrMissing = !existingReason || genericReasons.has(existingReason);
      return isOutdatedOrMissing && eventTextForScoring(e);
    })
    .slice(0, SCORE_BATCH);

  const { GEMMA_MODEL } = getServerEnv();

  for (const ev of toScore) {
    const scanTarget = toSecurityScanTarget(ev);
    const result = await scoreTextWithGemma(scanTarget);
    if (!result) continue;

    await admin.from("comment_scores").upsert(
      {
        repository_id: repositoryId,
        event_id: ev.id,
        risk_score: result.risk_score,
        signals: result.signals,
        reason: result.reason,
        model: result.model_used || GEMMA_MODEL,
      },
      { onConflict: "event_id" },
    );
  }

  const { data: allScores } = await admin
    .from("comment_scores")
    .select("risk_score, signals, reason, event_id")
    .eq("repository_id", repositoryId);

  const linguistic_score =
    allScores && allScores.length
      ? Math.round(
          allScores.reduce((s, r) => s + r.risk_score, 0) / allScores.length,
        )
      : (toScore.length === 0 && flat.length > 0 ? 12 : 0);

  const { week_start, signals, velocity_score } =
    computeBehaviorSignals(flat);

  for (const sig of signals) {
    await admin.from("behavior_signals").upsert(
      {
        repository_id: repositoryId,
        week_start,
        signal_key: sig.signal_key,
        score: sig.score,
        detail: sig.detail,
      },
      { onConflict: "repository_id,week_start,signal_key" },
    );
  }

  // Build high-value actionable red flags
  const red_flags: Array<{
    event_id?: number;
    risk_score: number;
    reason?: string;
    signals?: string[];
  }> = [];

  // 1. High-risk code/comment events
  (allScores ?? [])
    .filter((s) => s.risk_score >= 40)
    .slice(0, 8)
    .forEach((s) => {
      red_flags.push({
        event_id: s.event_id,
        risk_score: s.risk_score,
        reason: s.reason,
        signals: s.signals as string[],
      });
    });

  // 2. High-risk behavioral anomaly signals with detailed explanations
  signals
    .filter((s) => s.score >= 40)
    .forEach((s) => {
      red_flags.push({
        event_id: 0,
        risk_score: s.score,
        reason: explainBehaviorSignal(s.signal_key, s.score),
        signals: [s.signal_key],
      });
    });

  const { risk_score, band } = combineRisk(linguistic_score, velocity_score);

  await admin.from("risk_scores").upsert(
    {
      repository_id: repositoryId,
      week_start,
      linguistic_score,
      velocity_score,
      risk_score,
      band,
      red_flags,
    },
    { onConflict: "repository_id,week_start" },
  );

  // Sync latest risk scores, comments and signals to Snowflake
  try {
    await syncRepositoryToSnowflake(repositoryId);
  } catch (sErr) {
    console.warn("[Snowflake Analysis Sync Warning]:", sErr);
  }

  return {
    week_start,
    linguistic_score,
    velocity_score,
    risk_score,
    band,
    scored_comments: toScore.length,
    red_flags,
  };
}
