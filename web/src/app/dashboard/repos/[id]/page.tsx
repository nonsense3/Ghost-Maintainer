export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyzeButton } from "@/components/analyze-button";
import { ExplainScorePanel } from "@/components/explain-score-panel";
import { GlobalNav } from "@/components/global-nav";
import { RedFlagList } from "@/components/red-flag-list";
import { RiskGauge } from "@/components/risk-gauge";
import { RiskTrend } from "@/components/risk-trend";
import { SnowflakeHub } from "@/components/snowflake-hub";
import { generateSnowflakeAnalysisSql } from "@/lib/snowflake/client";
import { createClient } from "@/lib/supabase/server";


type Params = { params: Promise<{ id: string }> };

const DEMO_REPOS: Record<
  string,
  {
    repo: { id: string; full_name: string; owner: string; name: string };
    riskHistory: Array<{
      week_start: string;
      risk_score: number;
      band: string;
      linguistic_score: number;
      velocity_score: number;
      red_flags: Array<{
        event_id?: number;
        risk_score: number;
        reason?: string;
        signals?: string[];
      }>;
    }>;
    behavior: Array<{
      signal_key: string;
      score: number;
      detail: Record<string, unknown>;
    }>;
    commentScores: Array<{
      risk_score: number;
      reason: string;
      signals: string[];
    }>;
  }
> = {
  "demo-xz": {
    repo: {
      id: "demo-xz",
      full_name: "xz/xz-utils",
      owner: "xz",
      name: "xz-utils (CVE-2024-3094)",
    },
    riskHistory: [
      {
        week_start: "2024-01-08",
        risk_score: 22,
        band: "low",
        linguistic_score: 20,
        velocity_score: 24,
        red_flags: [],
      },
      {
        week_start: "2024-01-22",
        risk_score: 41,
        band: "medium",
        linguistic_score: 45,
        velocity_score: 37,
        red_flags: [],
      },
      {
        week_start: "2024-02-05",
        risk_score: 64,
        band: "medium",
        linguistic_score: 68,
        velocity_score: 60,
        red_flags: [],
      },
      {
        week_start: "2024-02-19",
        risk_score: 79,
        band: "high",
        linguistic_score: 82,
        velocity_score: 76,
        red_flags: [],
      },
      {
        week_start: "2024-03-04",
        risk_score: 86,
        band: "high",
        linguistic_score: 89,
        velocity_score: 82,
        red_flags: [
          {
            event_id: 101,
            risk_score: 95,
            reason:
              "Sockpuppet accounts pressuring maintainer to hand over commit rights: 'Is there any progress on this? Jia Tan has been waiting.'",
            signals: ["hostile_takeover", "coercive_pressure"],
          },
          {
            event_id: 102,
            risk_score: 91,
            reason:
              "Obfuscated binary payload disguised in CMake test suite changes.",
            signals: ["unexplained_binary_injection", "vague_commit_intent"],
          },
          {
            event_id: 103,
            risk_score: 88,
            reason:
              "Author Lasse Collin communicating chronic burnout: 'I haven't lost interest, but my ability to care has been fairly limited.'",
            signals: ["severe_exhaustion", "relinquishing_control"],
          },
        ],
      },
    ],
    behavior: [
      {
        signal_key: "new_author_surge",
        score: 92,
        detail: { new_author_commits: 18, total_commits: 20 },
      },
      {
        signal_key: "unreviewed_merges",
        score: 85,
        detail: { unreviewed_ratio: 0.85 },
      },
      {
        signal_key: "commit_time_shift",
        score: 84,
        detail: { l1_drift: 1.68 },
      },
      {
        signal_key: "activity_drop",
        score: 78,
        detail: { drop_percentage: 78 },
      },
      {
        signal_key: "reply_latency_spike",
        score: 71,
        detail: { z_score: 2.84 },
      },
    ],
    commentScores: [
      {
        risk_score: 95,
        reason:
          "Sockpuppet accounts pressuring maintainer: 'Progress will not happen until there is a new maintainer.'",
        signals: ["hostile_takeover", "coercive_pressure"],
      },
      {
        risk_score: 91,
        reason:
          "Disguised binary payload inserted into release archive test artifacts.",
        signals: ["unexplained_binary_injection"],
      },
      {
        risk_score: 88,
        reason:
          "Solo maintainer acknowledging exhaustion and inability to audit incoming patches.",
        signals: ["severe_exhaustion", "relinquishing_control"],
      },
    ],
  },
  "demo-flask": {
    repo: {
      id: "demo-flask",
      full_name: "pallets/flask",
      owner: "pallets",
      name: "flask",
    },
    riskHistory: [
      {
        week_start: "2024-01-08",
        risk_score: 14,
        band: "low",
        linguistic_score: 15,
        velocity_score: 13,
        red_flags: [],
      },
      {
        week_start: "2024-01-22",
        risk_score: 12,
        band: "low",
        linguistic_score: 10,
        velocity_score: 14,
        red_flags: [],
      },
      {
        week_start: "2024-02-05",
        risk_score: 15,
        band: "low",
        linguistic_score: 16,
        velocity_score: 14,
        red_flags: [],
      },
      {
        week_start: "2024-02-19",
        risk_score: 11,
        band: "low",
        linguistic_score: 11,
        velocity_score: 11,
        red_flags: [],
      },
      {
        week_start: "2024-03-04",
        risk_score: 13,
        band: "low",
        linguistic_score: 12,
        velocity_score: 14,
        red_flags: [],
      },
    ],
    behavior: [
      {
        signal_key: "reply_latency_spike",
        score: 16,
        detail: { z_score: 0.1 },
      },
      {
        signal_key: "new_author_surge",
        score: 15,
        detail: { new_author_commits: 2, total_commits: 15 },
      },
      {
        signal_key: "commit_time_shift",
        score: 12,
        detail: { l1_drift: 0.24 },
      },
      {
        signal_key: "activity_drop",
        score: 8,
        detail: { drop_percentage: 8 },
      },
      {
        signal_key: "unreviewed_merges",
        score: 6,
        detail: { unreviewed_ratio: 0.06 },
      },
    ],
    commentScores: [
      {
        risk_score: 12,
        reason: "Standard code review and release coordination notes.",
        signals: ["healthy_communication"],
      },
    ],
  },
};

export default async function RepoDetailPage({ params }: Params) {
  const { id } = await params;

  let repo;
  let riskHistory;
  let behavior;
  let commentScores;

  // Check demo repositories
  if (DEMO_REPOS[id]) {
    const demo = DEMO_REPOS[id];
    repo = demo.repo;
    riskHistory = demo.riskHistory;
    behavior = demo.behavior;
    commentScores = demo.commentScores;
  } else {
    try {
      const supabase = await createClient();

      const { data: dbRepo } = await supabase
        .from("repositories")
        .select("id, full_name, owner, name")
        .eq("id", id)
        .maybeSingle();

      if (!dbRepo) notFound();
      repo = dbRepo;

      const { data: dbHistory } = await supabase
        .from("risk_scores")
        .select(
          "week_start, risk_score, band, linguistic_score, velocity_score, red_flags",
        )
        .eq("repository_id", id)
        .order("week_start", { ascending: true });
      riskHistory = dbHistory;

      const { data: dbBehavior } = await supabase
        .from("behavior_signals")
        .select("signal_key, score, detail")
        .eq("repository_id", id)
        .order("score", { ascending: false });
      behavior = dbBehavior;

      const { data: dbComments } = await supabase
        .from("comment_scores")
        .select("risk_score, reason, signals")
        .eq("repository_id", id)
        .order("risk_score", { ascending: false })
        .limit(12);
      commentScores = dbComments;
    } catch {
      // In case Supabase credentials are not connected yet
      notFound();
    }
  }

  const latest = riskHistory?.[riskHistory.length - 1];

  const redFlags =
    (latest?.red_flags as Array<{
      event_id?: number;
      risk_score: number;
      reason?: string;
      signals?: string[];
    }>) ?? [];

  return (
    <div className="min-h-screen bg-canvas-parchment pt-16">
      <GlobalNav />
      <div className="sub-nav-frosted h-[52px] flex items-center justify-between px-6 border-b border-hairline max-w-[1440px] mx-auto w-full">
        <Link href="/dashboard" className="text-link text-body">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          {id.startsWith("demo-") && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-100 text-blue-800">
              Demo Incident Study
            </span>
          )}
          <span className="text-[21px] font-semibold text-ink truncate">
            {repo.full_name}
          </span>
        </div>
      </div>
      <main className="max-w-[1440px] mx-auto px-6 py-12 space-y-8">
        {!id.startsWith("demo-") && (
          <AnalyzeButton repositoryId={id} repoName={repo.full_name} />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {latest ? (
            <RiskGauge score={latest.risk_score} band={latest.band} />
          ) : (
            <div className="store-utility-card">
              <p className="text-body text-ink-muted-48">
                No risk score yet. Ingest data, then run analysis (Ollama + Gemma
                model recommended).
              </p>
            </div>
          )}
          <RiskTrend
            history={(riskHistory ?? []).map((r) => ({
              week_start: r.week_start,
              risk_score: r.risk_score,
            }))}
          />
        </div>

        {latest && (
          <div className="store-utility-card grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-caption text-ink-muted-48">
                Linguistic Component (Gemma 2)
              </p>
              <p className="text-display-md text-ink">
                {latest.linguistic_score}
                <span className="text-body text-ink-muted-48"> / 100</span>
              </p>
            </div>
            <div>
              <p className="text-caption text-ink-muted-48">
                Velocity Component (SQL Behavior)
              </p>
              <p className="text-display-md text-ink">
                {latest.velocity_score}
                <span className="text-body text-ink-muted-48"> / 100</span>
              </p>
            </div>
          </div>
        )}

        {/* Snowflake Zero-Egress Analytics & Cortex Hub */}
        <SnowflakeHub
          repositoryId={id}
          fullName={repo.full_name}
          initialSql={generateSnowflakeAnalysisSql(repo.full_name)}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RedFlagList flags={redFlags} />
          <ExplainScorePanel
            rows={(commentScores ?? []).map((c) => ({
              risk_score: c.risk_score,
              reason: c.reason,
              signals: c.signals as string[] | null,
            }))}
          />
        </div>


        {behavior && behavior.length > 0 && (
          <section className="store-utility-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-strong text-ink">
                Behavior Signals (PRD §5)
              </p>
              <span className="text-caption text-ink-muted-48">
                Window functions evaluated against baseline
              </span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {behavior.map((b) => {
                const sigColor =
                  b.score >= 70
                    ? "#cc3300"
                    : b.score >= 35
                      ? "#b37400"
                      : "#0066cc";
                return (
                  <li
                    key={b.signal_key}
                    className="p-3.5 rounded-xl bg-canvas-parchment border border-hairline/70"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-caption-strong text-ink capitalize">
                        {b.signal_key.replaceAll("_", " ")}
                      </span>
                      <span
                        className="text-caption font-bold"
                        style={{ color: sigColor }}
                      >
                        {b.score}/100
                      </span>
                    </div>
                    <div className="h-1 bg-hairline rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${b.score}%`,
                          backgroundColor: sigColor,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
