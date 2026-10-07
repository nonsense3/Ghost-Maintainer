import type { FlatEvent } from "./events";

export type BehaviorSignal = {
  signal_key: string;
  score: number;
  detail: Record<string, unknown>;
};

const MS_DAY = 86400000;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function weekStart(d = new Date()) {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy.toISOString().slice(0, 10);
}

export function computeBehaviorSignals(events: FlatEvent[]): {
  week_start: string;
  signals: BehaviorSignal[];
  velocity_score: number;
} {
  const now = Date.now();
  const recentStart = now - 30 * MS_DAY;
  const baselineStart = now - 120 * MS_DAY;

  const commits = events.filter((e) => e.source === "commit");
  const recentCommits = commits.filter(
    (e) => new Date(e.occurred_at).getTime() >= recentStart,
  );
  const baselineCommits = commits.filter((e) => {
    const t = new Date(e.occurred_at).getTime();
    return t >= baselineStart && t < recentStart;
  });

  const recentWeekly = recentCommits.length / 4.3;
  const baselineWeekly = baselineCommits.length / (90 / 7) || 0.001;
  const dropRatio = 1 - recentWeekly / baselineWeekly;
  const activity_drop = clamp(dropRatio * 100);

  const hourBucket = (list: FlatEvent[]) => {
    const hours = list.map((e) => new Date(e.occurred_at).getUTCHours());
    const dist = new Array(24).fill(0);
    hours.forEach((h) => {
      dist[h] += 1;
    });
    const total = hours.length || 1;
    return dist.map((c) => c / total);
  };

  const recentDist = hourBucket(recentCommits);
  const baselineDist = hourBucket(baselineCommits.slice(-200));
  let l1 = 0;
  for (let i = 0; i < 24; i++) {
    l1 += Math.abs(recentDist[i] - baselineDist[i]);
  }
  const commit_time_shift = clamp(l1 * 50);

  const authorFirstSeen = new Map<string, number>();
  for (const e of commits) {
    if (!e.author) continue;
    const t = new Date(e.occurred_at).getTime();
    const prev = authorFirstSeen.get(e.author);
    if (prev === undefined || t < prev) authorFirstSeen.set(e.author, t);
  }
  let newAuthorWeight = 0;
  let totalWeight = 0;
  for (const e of recentCommits) {
    if (!e.author) continue;
    totalWeight += 1;
    const first = authorFirstSeen.get(e.author)!;
    if (first >= recentStart) newAuthorWeight += 1;
  }
  const new_author_surge = clamp(
    totalWeight ? (newAuthorWeight / totalWeight) * 100 : 0,
  );

  const prs = events.filter((e) => e.source === "pr");
  const mergedRecent = prs.filter((e) => {
    const merged = e.payload.merged_at as string | null;
    return merged && new Date(merged).getTime() >= recentStart;
  });
  const unreviewed = mergedRecent.filter(
    (e) => !(e.payload.body as string | null)?.includes("review"),
  );
  const unreviewed_merges = clamp(
    mergedRecent.length
      ? (unreviewed.length / mergedRecent.length) * 100
      : 0,
  );

  const issues = events.filter((e) => e.source === "issue");
  const comments = events.filter((e) => e.source === "comment");
  const replyDelays: number[] = [];
  for (const issue of issues) {
    const issueTime = new Date(issue.occurred_at).getTime();
    const issueNum = issue.payload.number as number | undefined;
    if (issueNum === undefined) continue;
    const related = comments.filter(
      (c) => c.payload.issue_number === issueNum,
    );
    if (!related.length) continue;
    const first = related.reduce((min, c) =>
      new Date(c.occurred_at).getTime() < new Date(min.occurred_at).getTime()
        ? c
        : min,
    );
    replyDelays.push(new Date(first.occurred_at).getTime() - issueTime);
  }
  const avgDelay =
    replyDelays.length > 0
      ? replyDelays.reduce((a, b) => a + b, 0) / replyDelays.length
      : 0;
  const reply_latency_spike = clamp(Math.min(100, avgDelay / MS_DAY / 7 * 30));

  const signals: BehaviorSignal[] = [
    { signal_key: "activity_drop", score: activity_drop, detail: { recentWeekly, baselineWeekly } },
    { signal_key: "commit_time_shift", score: commit_time_shift, detail: { l1 } },
    { signal_key: "new_author_surge", score: new_author_surge, detail: { newAuthorWeight, totalWeight } },
    { signal_key: "unreviewed_merges", score: unreviewed_merges, detail: { merged: mergedRecent.length } },
    { signal_key: "reply_latency_spike", score: reply_latency_spike, detail: { avgDelayMs: avgDelay } },
  ];

  const velocity_score = clamp(
    signals.reduce((s, x) => s + x.score, 0) / signals.length,
  );

  return { week_start: weekStart(), signals, velocity_score };
}

export function riskBand(score: number): "low" | "medium" | "high" {
  if (score <= 33) return "low";
  if (score <= 66) return "medium";
  return "high";
}

export function combineRisk(
  linguistic: number,
  velocity: number,
): { risk_score: number; band: "low" | "medium" | "high" } {
  const risk_score = clamp(0.5 * linguistic + 0.5 * velocity);
  return { risk_score, band: riskBand(risk_score) };
}
