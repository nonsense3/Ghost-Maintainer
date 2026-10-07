export type FlatEvent = {
  id: number;
  source: string;
  occurred_at: string;
  author: string | null;
  body: string | null;
  payload: Record<string, unknown>;
};

export function flattenEvent(row: {
  id: number;
  source: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}): FlatEvent {
  const p = row.payload;
  let author: string | null = null;
  let body: string | null = null;

  switch (row.source) {
    case "commit": {
      const commit = p.commit as { author?: { name?: string }; message?: string };
      author =
        (p.author as { login?: string } | null)?.login ??
        commit?.author?.name ??
        null;
      body = commit?.message ?? null;
      break;
    }
    case "issue":
    case "pr": {
      author = (p.user as { login?: string } | null)?.login ?? null;
      body = (p.body as string | null) ?? (p.title as string | null) ?? null;
      break;
    }
    case "comment": {
      author = (p.user as { login?: string } | null)?.login ?? null;
      body = (p.body as string) ?? null;
      break;
    }
  }

  return {
    id: row.id,
    source: row.source,
    occurred_at: row.occurred_at,
    author,
    body,
    payload: p,
  };
}

export function eventTextForScoring(flat: FlatEvent): string | null {
  if (!flat.body) return null;
  const trimmed = flat.body.trim();
  // Comments, PR descriptions, issue bodies, and meaningful commit messages
  if (flat.source === "comment" || flat.source === "issue" || flat.source === "pr") {
    return trimmed.length >= 8 ? trimmed : null;
  }
  if (flat.source === "commit" && trimmed.length >= 12) {
    return trimmed;
  }
  return null;
}

