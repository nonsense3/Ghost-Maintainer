export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyzeButton } from "@/components/analyze-button";
import { ExplainScorePanel } from "@/components/explain-score-panel";
import { GlobalNav } from "@/components/global-nav";
import { RedFlagList } from "@/components/red-flag-list";
import { RiskGauge } from "@/components/risk-gauge";
import { RiskTrend } from "@/components/risk-trend";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export default async function RepoDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: repo } = await supabase
    .from("repositories")
    .select("id, full_name, owner, name")
    .eq("id", id)
    .maybeSingle();

  if (!repo) notFound();

  const { data: riskHistory } = await supabase
    .from("risk_scores")
    .select("week_start, risk_score, band, linguistic_score, velocity_score, red_flags")
    .eq("repository_id", id)
    .order("week_start", { ascending: true });

  const latest = riskHistory?.[riskHistory.length - 1];

  const { data: behavior } = await supabase
    .from("behavior_signals")
    .select("signal_key, score, detail")
    .eq("repository_id", id)
    .order("score", { ascending: false });

  const { data: commentScores } = await supabase
    .from("comment_scores")
    .select("risk_score, reason, signals")
    .eq("repository_id", id)
    .order("risk_score", { ascending: false })
    .limit(12);

  const redFlags = (latest?.red_flags as Array<{
    event_id?: number;
    risk_score: number;
    reason?: string;
    signals?: string[];
  }>) ?? [];

  return (
    <div className="min-h-screen bg-canvas-parchment">
      <GlobalNav />
      <div className="sub-nav-frosted h-[52px] flex items-center justify-between px-6 border-b border-hairline max-w-[1440px] mx-auto w-full">
        <Link href="/dashboard" className="text-link text-body">
          Dashboard
        </Link>
        <span className="text-[21px] font-semibold text-ink truncate">
          {repo.full_name}
        </span>
      </div>
      <main className="max-w-[1440px] mx-auto px-6 py-12 space-y-8">
        <AnalyzeButton repositoryId={id} />

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
              <p className="text-caption text-ink-muted-48">Linguistic</p>
              <p className="text-display-md text-ink">{latest.linguistic_score}</p>
            </div>
            <div>
              <p className="text-caption text-ink-muted-48">Velocity</p>
              <p className="text-display-md text-ink">{latest.velocity_score}</p>
            </div>
          </div>
        )}

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
            <p className="text-body-strong text-ink mb-4">Behavior signals</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {behavior.map((b) => (
                <li key={b.signal_key} className="text-caption text-ink-muted-80">
                  <span className="text-caption-strong text-ink capitalize">
                    {b.signal_key.replaceAll("_", " ")}
                  </span>
                  : {b.score}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
