export const instant = false;

import Link from "next/link";
import { AddRepoForm } from "@/components/add-repo-form";
import { GlobalNav } from "@/components/global-nav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

const PRESET_DEMO_REPOS = [
  {
    id: "demo-xz",
    fullName: "xz/xz-utils",
    tagline: "2024 Social Engineering Backdoor Takeover (CVE-2024-3094)",
    riskScore: 86,
    band: "high",
    signalsCount: 5,
    flaggedComments: 3,
  },
  {
    id: "demo-flask",
    fullName: "pallets/flask",
    tagline: "Healthy Active Multi-Maintainer Foundation Reference",
    riskScore: 13,
    band: "low",
    signalsCount: 0,
    flaggedComments: 0,
  },
];

export default async function DashboardPage() {
  let user: { email?: string } | null = null;
  let repos: Array<{ id: string; full_name: string; created_at: string }> | null =
    null;
  const riskByRepo = new Map<string, { risk_score: number; band: string }>();
  let hasSupabase = false;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
    hasSupabase = true;

    const { data: dbRepos } = await supabase
      .from("repositories")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false });
    repos = dbRepos;

    const repoIds = (repos ?? []).map((r) => r.id);
    const { data: latestRisk } = repoIds.length
      ? await supabase
          .from("risk_scores")
          .select("repository_id, risk_score, band, week_start")
          .in("repository_id", repoIds)
          .order("week_start", { ascending: false })
      : { data: [] };

    for (const row of latestRisk ?? []) {
      if (!riskByRepo.has(row.repository_id)) {
        riskByRepo.set(row.repository_id, {
          risk_score: row.risk_score,
          band: row.band,
        });
      }
    }
  } catch {
    hasSupabase = false;
  }

  return (
    <div className="min-h-screen bg-canvas-parchment">
      <GlobalNav
        right={
          user ? (
            <form action={signOut}>
              <button type="submit" className="btn-dark-utility">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login" className="btn-dark-utility">
              Sign in
            </Link>
          )
        }
      />
      <div className="sub-nav-frosted h-[52px] flex items-center justify-between px-6 border-b border-hairline max-w-[1440px] mx-auto w-full">
        <span className="text-[21px] font-semibold text-ink">Dashboard</span>
        <span className="text-caption text-ink-muted-48">
          PRD MVP · Gemma Linguistic + SQL Velocity Index
        </span>
      </div>
      <main className="max-w-[1440px] mx-auto px-6 py-12 space-y-12">
        {/* User bar or setup note */}
        {user ? (
          <div>
            <p className="text-caption text-ink-muted-48">Signed in as</p>
            <p className="text-body-strong text-ink">{user.email}</p>
          </div>
        ) : !hasSupabase ? (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-caption text-blue-900">
            <span className="font-semibold">Demo Sandbox Active:</span> Supabase
            environment credentials not configured yet. You can explore complete
            interactive incident telemetry below or connect your Supabase database
            via <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">web/.env.local</code>.
          </div>
        ) : null}

        {/* 1. Preset Case Studies Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-display-md text-ink font-semibold">
                Preset Incident Studies
              </h2>
              <p className="text-caption text-ink-muted-80">
                Explore pre-computed audit reports for historic supply chain incidents.
              </p>
            </div>
            <span className="text-caption-strong text-primary font-mono text-xs uppercase tracking-wider">
              PRD Benchmark
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {PRESET_DEMO_REPOS.map((demo) => {
              const isHigh = demo.band === "high";
              return (
                <Link
                  key={demo.id}
                  href={`/dashboard/repos/${demo.id}`}
                  className="store-utility-card block hover:border-primary transition-all p-6 bg-canvas"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-body-strong text-ink">{demo.fullName}</p>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isHigh
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      Risk {demo.riskScore} ({demo.band.toUpperCase()})
                    </span>
                  </div>
                  <p className="text-caption text-ink-muted-80 mt-2">
                    {demo.tagline}
                  </p>
                  <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-caption text-ink-muted-48">
                    <span>
                      {isHigh ? "Elevated behavioral drift" : "Stable baseline"}
                    </span>
                    <span className="text-primary font-medium">
                      View full report →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 2. Tracked Repositories Section */}
        <section className="space-y-6">
          <AddRepoForm />

          <div>
            <h2 className="text-display-md text-ink font-semibold mb-4">
              Your Tracked Repositories
            </h2>
            {repos && repos.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {repos.map((repo) => {
                  const risk = riskByRepo.get(repo.id);
                  return (
                    <li key={repo.id}>
                      <Link
                        href={`/dashboard/repos/${repo.id}`}
                        className="store-utility-card block hover:border-primary transition-colors bg-canvas"
                      >
                        <p className="text-body-strong text-ink">
                          {repo.full_name}
                        </p>
                        {risk ? (
                          <p className="text-caption text-ink-muted-80 mt-2">
                            Risk {risk.risk_score}{" "}
                            <span className="capitalize">({risk.band})</span>
                          </p>
                        ) : (
                          <p className="text-caption text-ink-muted-48 mt-2">
                            Not analyzed yet
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 rounded-2xl bg-canvas border border-hairline text-center">
                <p className="text-body text-ink-muted-48">
                  No custom repositories tracked yet. Add one with the form
                  above to trigger GitHub ingest and Gemma scoring.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
