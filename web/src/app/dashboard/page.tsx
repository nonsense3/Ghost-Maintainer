export const instant = false;

import Link from "next/link";
import { AddRepoForm } from "@/components/add-repo-form";
import { GlobalNav } from "@/components/global-nav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";



export default async function DashboardPage() {
  let user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null = null;
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
    <div className="min-h-screen bg-canvas-parchment pt-16">
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
        {user ? (() => {
          const meta = user.user_metadata || {};
          const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
          const fullName = typeof meta.full_name === "string" ? meta.full_name : null;
          const githubUsername = typeof meta.github_username === "string" ? meta.github_username : null;
          const displayName = fullName || githubUsername || user.email || "Maintainer";
          const initialLetter = displayName[0]?.toUpperCase() || "U";

          return (
            <div className="p-6 rounded-2xl bg-canvas border border-hairline shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-raised border border-hairline flex items-center justify-center font-bold text-lg text-ink overflow-hidden shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initialLetter}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-body-strong text-ink">{displayName}</p>
                    {githubUsername && (
                      <span className="text-caption text-ink-muted-48">
                        @{githubUsername}
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-ink-muted-48">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3"><div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Maintainer Connected</div></div>
            </div>
          );
        })() : !hasSupabase ? (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-caption text-blue-900">
            <span className="font-semibold">Demo Sandbox Active:</span> Supabase
            environment credentials not configured yet. You can explore complete
            interactive incident telemetry below or connect your Supabase database
            via <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">web/.env.local</code>.
          </div>
        ) : null}


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

