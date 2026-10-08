export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Dashboard & Repository Triage",
  description: "Monitor GitHub repository maintainer risk scores, behavioral signal metrics, and Gemma 4B security flags in real-time.",
};

import Link from "next/link";
import { redirect } from "next/navigation";
import { AddRepoForm } from "@/components/add-repo-form";
import { TrackedRepoCard, RepoRiskData } from "@/components/tracked-repo-card";
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
  const riskByRepo = new Map<string, RepoRiskData>();
  const eventCountByRepo = new Map<string, number>();

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (!user) {
      redirect("/login?next=/dashboard");
    }

    const { data: dbRepos } = await supabase
      .from("repositories")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false });
    repos = dbRepos;

    const repoIds = (repos ?? []).map((r) => r.id);
    const { data: latestRisk } = repoIds.length
      ? await supabase
          .from("risk_scores")
          .select("repository_id, risk_score, band, linguistic_score, velocity_score, red_flags, week_start")
          .in("repository_id", repoIds)
          .order("week_start", { ascending: false })
      : { data: [] };

    for (const row of latestRisk ?? []) {
      if (!riskByRepo.has(row.repository_id)) {
        riskByRepo.set(row.repository_id, {
          risk_score: row.risk_score,
          band: row.band,
          linguistic_score: row.linguistic_score,
          velocity_score: row.velocity_score,
          red_flags: row.red_flags,
        });
      }
    }

    if (repoIds.length) {
      const { data: eventsData } = await supabase
        .from("raw_github_events")
        .select("repository_id");
      for (const ev of eventsData ?? []) {
        eventCountByRepo.set(
          ev.repository_id,
          (eventCountByRepo.get(ev.repository_id) || 0) + 1,
        );
      }
    }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err; // Re-throw Next.js redirect
    }
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="min-h-screen bg-canvas-parchment pt-16">
      <GlobalNav user={user} />
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
        })() : null}


        {/* 2. Tracked Repositories Section */}
        <section className="space-y-6">
          <AddRepoForm />

          <div>
            <h2 className="text-display-md text-ink font-semibold mb-4">
              Your Tracked Repositories
            </h2>
            {repos && repos.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {repos.map((repo) => (
                  <li key={repo.id}>
                    <TrackedRepoCard
                      repo={repo}
                      initialRisk={riskByRepo.get(repo.id)}
                      eventCount={eventCountByRepo.get(repo.id)}
                    />
                  </li>
                ))}
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

