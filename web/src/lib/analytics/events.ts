import { SecurityScanTarget } from "@/lib/gemma/score";

export type FlatEvent = {
  id: number;
  source: string;
  external_id: string;
  occurred_at: string;
  author: string | null;
  title: string | null;
  body: string | null;
  files: Array<{
    filename: string;
    additions?: number;
    deletions?: number;
    status?: string;
    patch?: string;
  }>;
  payload: Record<string, unknown>;
};

export function flattenEvent(row: {
  id: number;
  source: string;
  external_id?: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}): FlatEvent {
  const p = row.payload;
  let author: string | null = null;
  let title: string | null = null;
  let body: string | null = null;
  const files: Array<{
    filename: string;
    additions?: number;
    deletions?: number;
    status?: string;
    patch?: string;
  }> = Array.isArray(p.files) ? (p.files as typeof files) : [];

  switch (row.source) {
    case "commit": {
      const commit = p.commit as { author?: { name?: string }; message?: string };
      author =
        (p.author as { login?: string } | null)?.login ??
        commit?.author?.name ??
        null;
      title = commit?.message ? commit.message.split("\n")[0] : null;
      body = commit?.message ?? null;
      break;
    }
    case "issue":
    case "pr": {
      author = (p.user as { login?: string } | null)?.login ?? null;
      title = (p.title as string | null) ?? null;
      body = (p.body as string | null) ?? (p.title as string | null) ?? null;
      break;
    }
    case "comment": {
      author = (p.user as { login?: string } | null)?.login ?? null;
      title = "Issue / PR Comment";
      body = (p.body as string) ?? null;
      break;
    }
  }

  const external_id =
    row.external_id ??
    (p.sha as string) ??
    String(p.id ?? row.id);

  return {
    id: row.id,
    source: row.source,
    external_id,
    occurred_at: row.occurred_at,
    author,
    title,
    body,
    files,
    payload: p,
  };
}

export function eventTextForScoring(flat: FlatEvent): string | null {
  if (!flat.body && (!flat.files || flat.files.length === 0)) return null;
  const trimmed = (flat.body || "").trim();
  // Comments, PR descriptions, issue bodies, or commits with messages/files
  if (flat.source === "comment" || flat.source === "issue" || flat.source === "pr") {
    return trimmed.length >= 4 ? trimmed : null;
  }
  if (flat.source === "commit") {
    return trimmed.length >= 4 || flat.files.length > 0 ? (trimmed || "Code commit update") : null;
  }
  return null;
}

export function toSecurityScanTarget(flat: FlatEvent): SecurityScanTarget {
  return {
    id: flat.id,
    source: flat.source as "commit" | "pr" | "issue" | "comment",
    external_id: flat.external_id,
    author: flat.author,
    occurred_at: flat.occurred_at,
    titleOrMessage: flat.title || flat.body || "Code update",
    bodyOrDescription: flat.body,
    files: flat.files,
  };
}
