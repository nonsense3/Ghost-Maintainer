import "server-only";
import { githubFetch } from "./client";

export type EventSource = "commit" | "pr" | "issue" | "comment";

export type IngestEvent = {
  source: EventSource;
  external_id: string;
  occurred_at: string;
  payload: Record<string, unknown>;
};

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

function sinceIso() {
  return new Date(Date.now() - SIX_MONTHS_MS).toISOString();
}

async function paginate<T>(
  path: string,
  maxPages = 5,
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  while (page <= maxPages) {
    const sep = path.includes("?") ? "&" : "?";
    const chunk = await githubFetch<T[]>(
      `${path}${sep}per_page=100&page=${page}`,
    );
    if (!chunk.length) break;
    out.push(...chunk);
    if (chunk.length < 100) break;
    page += 1;
  }
  return out;
}

export async function collectRepositoryEvents(
  owner: string,
  name: string,
): Promise<IngestEvent[]> {
  const since = sinceIso();
  const events: IngestEvent[] = [];

  const commits = await paginate<{
    sha: string;
    commit: { author: { date: string }; message: string };
  }>(`/repos/${owner}/${name}/commits?since=${since}`);

  for (const c of commits) {
    events.push({
      source: "commit",
      external_id: c.sha,
      occurred_at: c.commit.author.date,
      payload: c as unknown as Record<string, unknown>,
    });
  }

  const pulls = await paginate<{
    id: number;
    number: number;
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    state: string;
    user: { login: string } | null;
    body: string | null;
    title: string;
  }>(`/repos/${owner}/${name}/pulls?state=all&sort=updated&direction=desc`);

  for (const pr of pulls) {
    if (new Date(pr.updated_at).getTime() < Date.now() - SIX_MONTHS_MS) continue;
    events.push({
      source: "pr",
      external_id: String(pr.id),
      occurred_at: pr.updated_at,
      payload: pr as unknown as Record<string, unknown>,
    });
  }

  const issues = await paginate<{
    id: number;
    number: number;
    created_at: string;
    updated_at: string;
    pull_request?: unknown;
    user: { login: string } | null;
    body: string | null;
    title: string;
  }>(`/repos/${owner}/${name}/issues?state=all&sort=updated&direction=desc`);

  const issueOnly = issues.filter((i) => !i.pull_request);
  for (const issue of issueOnly) {
    if (new Date(issue.updated_at).getTime() < Date.now() - SIX_MONTHS_MS) {
      continue;
    }
    events.push({
      source: "issue",
      external_id: String(issue.id),
      occurred_at: issue.updated_at,
      payload: issue as unknown as Record<string, unknown>,
    });
  }

  const commentCap = 25;
  for (const issue of issueOnly.slice(0, commentCap)) {
    const comments = await githubFetch<
      Array<{
        id: number;
        created_at: string;
        updated_at: string;
        user: { login: string } | null;
        body: string;
      }>
    >(
      `/repos/${owner}/${name}/issues/${issue.number}/comments?per_page=100`,
    );
    for (const comment of comments) {
      events.push({
        source: "comment",
        external_id: String(comment.id),
        occurred_at: comment.updated_at,
        payload: {
          ...comment,
          issue_number: issue.number,
        } as unknown as Record<string, unknown>,
      });
    }
  }

  return events;
}
