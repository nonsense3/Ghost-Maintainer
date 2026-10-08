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



export default async function RepoDetailPage({ params }: Params) {
  const { id } = await params;

  let repo: { id: string; full_name: string; owner: string; name: string } | null = null;
  let riskHistory: Array<{
    week_start: string;
    risk_score: number;
    band: string;
    linguistic_score: number;
    velocity_score: number;
    red_flags: unknown;
  }> = [];
  let behavior: Array<{
    signal_key: string;
    score: number;
    detail: Record<string, unknown>;
  }> = [];
  let commentScores: Array<{
    risk_score: number;
    reason: string;
    signals: string[];
  }> = [];

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
    riskHistory = dbHistory ?? [];

    const { data: dbBehavior } = await supabase
      .from("behavior_signals")
      .select("signal_key, score, detail")
      .eq("repository_id", id)
      .order("score", { ascending: false });
    behavior = dbBehavior ?? [];

    const { data: dbComments } = await supabase
      .from("comment_scores")
      .select("risk_score, reason, signals")
      .eq("repository_id", id)
      .order("risk_score", { ascending: false })
      .limit(12);
    commentScores = (dbComments as typeof commentScores) ?? [];
  } catch {
    notFound();
  }

  if (!repo) notFound();

  const latest = riskHistory[riskHistory.length - 1];

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
          <span className="text-[21px] font-semibold text-ink truncate">
            {repo.full_name}
          </span>
        </div>
      </div>
      <main className="max-w-[1440px] mx-auto px-6 py-12 space-y-8">
        <AnalyzeButton repositoryId={id} repoName={repo.full_name} />

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
                Linguistic Component (Gemma 4B)
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
