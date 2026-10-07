export const instant = false;

import Link from "next/link";
import { AddRepoForm } from "@/components/add-repo-form";
import { GlobalNav } from "@/components/global-nav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: repos } = await supabase
    .from("repositories")
    .select("id, full_name, created_at")
    .order("created_at", { ascending: false });

  const repoIds = (repos ?? []).map((r) => r.id);
  const { data: latestRisk } = repoIds.length
    ? await supabase
        .from("risk_scores")
        .select("repository_id, risk_score, band, week_start")
        .in("repository_id", repoIds)
        .order("week_start", { ascending: false })
    : { data: [] };

  const riskByRepo = new Map<string, { risk_score: number; band: string }>();
  for (const row of latestRisk ?? []) {
    if (!riskByRepo.has(row.repository_id)) {
      riskByRepo.set(row.repository_id, {
        risk_score: row.risk_score,
        band: row.band,
      });
    }
  }

  return (
    <div className="min-h-screen bg-canvas-parchment">
      <GlobalNav
        right={
          <form action={signOut}>
            <button type="submit" className="btn-dark-utility">
              Sign out
            </button>
          </form>
        }
      />
      <div className="sub-nav-frosted h-[52px] flex items-center px-6 border-b border-hairline max-w-[1440px] mx-auto w-full">
        <span className="text-[21px] font-semibold text-ink">Dashboard</span>
      </div>
      <main className="max-w-[1440px] mx-auto px-6 py-12 space-y-10">
        <div>
          <p className="text-caption text-ink-muted-48">Signed in as</p>
          <p className="text-body-strong text-ink">{user?.email}</p>
        </div>

        <AddRepoForm />

        <section>
          <h1 className="text-display-md text-ink mb-6">Tracked repositories</h1>
          {repos && repos.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {repos.map((repo) => {
                const risk = riskByRepo.get(repo.id);
                return (
                  <li key={repo.id}>
                    <Link
                      href={`/dashboard/repos/${repo.id}`}
                      className="store-utility-card block hover:border-primary transition-colors"
                    >
                      <p className="text-body-strong">{repo.full_name}</p>
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
            <p className="text-body text-ink-muted-48">
              Add a repository above to start monitoring.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
