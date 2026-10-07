import "server-only";
import { getServerEnv } from "@/lib/env/server";

const GITHUB_API = "https://api.github.com";

export async function githubFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { GITHUB_TOKEN } = getServerEnv();
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not set. Add it to web/.env.local (server-only).");
  }
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${path}: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export type RepoMeta = {
  full_name: string;
  default_branch: string;
};

export async function getRepository(owner: string, name: string): Promise<RepoMeta> {
  return githubFetch<RepoMeta & { default_branch: string }>(
    `/repos/${owner}/${name}`,
  );
}

/** Recent issues (includes comments via separate calls in a later iteration). */
export async function listRecentIssues(owner: string, name: string) {
  return githubFetch<
    Array<{
      id: number;
      number: number;
      title: string;
      created_at: string;
      updated_at: string;
      user: { login: string } | null;
    }>
  >(`/repos/${owner}/${name}/issues?state=all&per_page=30&sort=updated`);
}
