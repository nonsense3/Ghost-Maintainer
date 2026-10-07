import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env/server";
import { scoreTextWithGemma } from "@/lib/gemma/score";
import {
  combineRisk,
  computeBehaviorSignals,
} from "./behavior";
import { eventTextForScoring, flattenEvent } from "./events";

const SCORE_BATCH = 15;

export async function runRepositoryAnalysis(repositoryId: string) {
  const admin = createAdminClient();

  const { data: events, error } = await admin
    .from("raw_github_events")
    .select("id, source, occurred_at, payload")
    .eq("repository_id", repositoryId)
    .order("occurred_at", { ascending: false })
    .limit(2000);

  if (error) throw new Error(error.message);
  const flat = (events ?? []).map((e) =>
    flattenEvent({
      id: e.id,
      source: e.source,
      occurred_at: e.occurred_at,
      payload: e.payload as Record<string, unknown>,
    }),
  );

  const { data: existingScores } = await admin
    .from("comment_scores")
    .select("event_id")
    .eq("repository_id", repositoryId);

  const scored = new Set((existingScores ?? []).map((s) => s.event_id));
  const toScore = flat
    .filter((e) => !scored.has(e.id) && eventTextForScoring(e))
    .slice(0, SCORE_BATCH);

  const { GEMMA_MODEL } = getServerEnv();

  for (const ev of toScore) {
    const text = eventTextForScoring(ev)!;
    const result = await scoreTextWithGemma(text);
    if (!result) continue;
    await admin.from("comment_scores").upsert(
      {
        repository_id: repositoryId,
        event_id: ev.id,
        risk_score: result.risk_score,
        signals: result.signals,
        reason: result.reason,
        model: GEMMA_MODEL,
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
      : 0;

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

  const red_flags = (allScores ?? [])
    .filter((s) => s.risk_score >= 50)
    .slice(0, 8)
    .map((s) => ({
      event_id: s.event_id,
      risk_score: s.risk_score,
      reason: s.reason,
      signals: s.signals,
    }));

  signals
    .filter((s) => s.score >= 50)
    .forEach((s) => {
      red_flags.push({
        event_id: 0,
        risk_score: s.score,
        reason: `Behavior signal: ${s.signal_key}`,
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
