import "server-only";
import { getUserGitHubToken } from "./token";

const GITHUB_API = "https://api.github.com";

export async function githubFetch<T>(
  path: string,
  init?: RequestInit,
  tokenOverride?: string | null,
): Promise<T> {
  const token = tokenOverride || (await getUserGitHubToken());
  if (!token) {
    throw new Error(
      "GitHub token not configured. Please sign in with GitHub or set GITHUB_TOKEN in web/.env.local.",
    );
  }
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
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

export async function getRepository(
  owner: string,
  name: string,
  tokenOverride?: string | null,
): Promise<RepoMeta> {
  return githubFetch<RepoMeta & { default_branch: string }>(
    `/repos/${owner}/${name}`,
    undefined,
    tokenOverride,
  );
}

/** Recent issues (includes comments via separate calls in a later iteration). */
export async function listRecentIssues(
  owner: string,
  name: string,
  tokenOverride?: string | null,
) {
  return githubFetch<
    Array<{
      id: number;
      number: number;
      title: string;
      created_at: string;
      updated_at: string;
      user: { login: string } | null;
    }>
  >(
    `/repos/${owner}/${name}/issues?state=all&per_page=30&sort=updated`,
    undefined,
    tokenOverride,
  );
}
