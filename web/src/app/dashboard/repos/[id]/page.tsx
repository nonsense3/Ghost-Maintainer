export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnalyzeButton } from "@/components/analyze-button";
import { ExplainScorePanel, ScoredAuditItem } from "@/components/explain-score-panel";
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

  let user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null = null;
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
  let auditItems: ScoredAuditItem[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (!user) {
      redirect(`/login?next=/dashboard/repos/${id}`);
    }

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
      .select("risk_score, reason, signals, event_id, model, scored_at")
      .eq("repository_id", id)
      .order("risk_score", { ascending: false })
      .limit(16);

    const eventIds = (dbComments ?? []).map((c) => c.event_id).filter(Boolean);
    const { data: dbEvents } = eventIds.length
      ? await supabase
          .from("raw_github_events")
          .select("id, source, external_id, occurred_at, payload")
          .in("id", eventIds)
      : { data: [] };

    const eventMap = new Map((dbEvents ?? []).map((e) => [e.id, e]));

    auditItems = (dbComments ?? []).map((c) => {
      const ev = eventMap.get(c.event_id);
      const payload = (ev?.payload ?? {}) as Record<string, unknown>;
      const commit = payload.commit as { message?: string; author?: { name?: string } } | undefined;
      const userObj = payload.user as { login?: string } | undefined;
      const author =
        (payload.author as { login?: string } | undefined)?.login ??
        commit?.author?.name ??
        userObj?.login ??
        null;
      const title = commit?.message
        ? commit.message.split("\n")[0]
        : ((payload.title as string) ?? (payload.body as string)?.slice(0, 80) ?? "Code update");
      const files = (payload.files as Array<{
        filename: string;
        additions?: number;
        deletions?: number;
        status?: string;
        patch?: string;
      }>) ?? [];
      const patch = files.find((f) => f.patch)?.patch ?? (typeof payload.body === "string" ? payload.body : null);
      const htmlUrl =
        (payload.html_url as string) ??
        (ev?.source === "commit" && repo
          ? `https://github.com/${repo.full_name}/commit/${ev.external_id}`
          : null);

      return {
        event_id: c.event_id,
        source: (ev?.source ?? "commit") as "commit" | "pr" | "issue" | "comment",
        external_id: ev?.external_id ?? String(c.event_id),
        author,
        title,
        occurred_at: ev?.occurred_at ?? c.scored_at ?? new Date().toISOString(),
        files,
        codeSnippet: patch,
        html_url: htmlUrl,
        risk_score: c.risk_score,
        signals: (c.signals as string[]) ?? [],
        reason: c.reason ?? "",
        model: c.model ?? null,
      };
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
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
      <GlobalNav user={user} />
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
            items={auditItems}
            repoFullName={repo.full_name}
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
