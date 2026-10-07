"use client";

import { useState } from "react";

type SqlSignal = {
  id: string;
  name: string;
  meaning: string;
  math: string;
  sqlSnippet: string;
};

const SIGNALS: SqlSignal[] = [
  {
    id: "activity_drop",
    name: "Activity Drop",
    meaning: "Solo maintainer burning out commits and reviews significantly less than historic baseline.",
    math: "Drop Ratio = 1 - (Current Weekly Commits / 90-day Moving Average)",
    sqlSnippet: `WITH weekly_counts AS (
  SELECT repository_id, DATE_TRUNC('week', occurred_at)::date AS week_start,
         COUNT(*) AS weekly_events
  FROM github_events_flat
  WHERE source IN ('commit', 'pr')
  GROUP BY repository_id, week_start
)
SELECT repository_id, week_start,
       ROUND((1.0 - (weekly_events::numeric /
         NULLIF(AVG(weekly_events) OVER (
           PARTITION BY repository_id
           ORDER BY week_start ROWS BETWEEN 12 PRECEDING AND 1 PRECEDING
         ), 0))) * 100) AS activity_drop_score
FROM weekly_counts;`,
  },
  {
    id: "commit_time_shift",
    name: "Commit Time Shift",
    meaning: "Maintainer always committed 9–5 UTC, then commits abruptly switch to 3 AM UTC across different timezones.",
    math: "L1 Drift = Σ |P_recent(hour) - P_baseline(hour)| across 24 hour buckets",
    sqlSnippet: `WITH hour_histograms AS (
  SELECT repository_id, EXTRACT(HOUR FROM occurred_at) AS hr,
         COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '30 days') AS recent_c,
         COUNT(*) FILTER (WHERE occurred_at < NOW() - INTERVAL '30 days') AS base_c
  FROM github_events_flat WHERE source = 'commit'
  GROUP BY repository_id, hr
)
SELECT repository_id,
       LEAST(100, ROUND(SUM(ABS(recent_c::float / NULLIF(SUM(recent_c) OVER(), 0) -
                               base_c::float / NULLIF(SUM(base_c) OVER(), 0))) * 50)) AS shift_score
FROM hour_histograms GROUP BY repository_id;`,
  },
  {
    id: "new_author_surge",
    name: "New-Author Surge",
    meaning: "Unknown actor (e.g. Jia Tan) suddenly accounts for a massive proportion of recent code changes.",
    math: "New Author Volume = Commits by authors first seen in last 30d / Total recent commits",
    sqlSnippet: `WITH author_tenure AS (
  SELECT repository_id, author, MIN(occurred_at) AS first_seen
  FROM github_events_flat WHERE source = 'commit' GROUP BY repository_id, author
)
SELECT c.repository_id,
       ROUND((COUNT(*) FILTER (WHERE a.first_seen >= NOW() - INTERVAL '30 days')::numeric /
              COUNT(*)) * 100) AS new_author_surge_score
FROM github_events_flat c
JOIN author_tenure a ON c.repository_id = a.repository_id AND c.author = a.author
WHERE c.occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY c.repository_id;`,
  },
  {
    id: "unreviewed_merges",
    name: "Unreviewed Merges",
    meaning: "Code merged into the main release branch with zero peer review comments or approvals.",
    math: "Unreviewed Merges Ratio = Merged PRs without approvals / Total merged PRs",
    sqlSnippet: `SELECT repository_id,
       ROUND((COUNT(*) FILTER (
         WHERE is_merged = TRUE AND review_comments_count = 0
       )::numeric / NULLIF(COUNT(*) FILTER (WHERE is_merged = TRUE), 0)) * 100) AS unreviewed_merges_score
FROM github_events_flat
WHERE source = 'pr' AND occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY repository_id;`,
  },
  {
    id: "reply_latency_spike",
    name: "Reply Latency Spike",
    meaning: "Maintainer takes exponentially longer to triage incoming bug reports and questions.",
    math: "Z-Score = (Recent 30d Avg Latency - 90d Baseline Latency) / Baseline StdDev",
    sqlSnippet: `WITH first_replies AS (
  SELECT i.repository_id,
         EXTRACT(EPOCH FROM (MIN(c.occurred_at) - i.occurred_at)) / 3600.0 AS delay_hrs
  FROM github_events_flat i
  JOIN github_events_flat c ON i.repository_id = c.repository_id
       AND c.source = 'comment' AND (c.payload->>'issue_number') = (i.payload->>'number')
  WHERE i.source = 'issue' GROUP BY i.repository_id, i.event_id, i.occurred_at
)
SELECT repository_id,
       LEAST(100, ROUND(GREATEST(0, (AVG(delay_hrs) - AVG(delay_hrs) OVER()) /
         NULLIF(STDDEV(delay_hrs) OVER(), 0)) * 25)) AS latency_spike_score
FROM first_replies GROUP BY repository_id;`,
  },
];

export function SqlSignalsShowcase() {
  const [activeSignal, setActiveSignal] = useState<string>("commit_time_shift");
  const current = SIGNALS.find((s) => s.id === activeSignal)!;

  return (
    <div className="store-utility-card bg-surface-tile-1 text-on-dark border border-ink-muted-80/40 rounded-[22px] p-6 sm:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-ink-muted-80/40">
        <div>
          <span className="text-caption text-primary-on-dark font-mono uppercase tracking-wider block mb-1">
            Track 3 · Zero-Egress In-Database Analytics
          </span>
          <h3 className="text-display-md text-white font-semibold">
            Behavioral Signals Engine (Pure SQL)
          </h3>
          <p className="text-body text-body-muted mt-1">
            PRD §5 algorithms implemented with Postgres / Snowflake window functions and moving statistics.
          </p>
        </div>
      </div>

      {/* Signal Pills */}
      <div className="flex flex-wrap gap-2 py-6 border-b border-ink-muted-80/40">
        {SIGNALS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSignal(s.id)}
            className={`px-3.5 py-1.5 rounded-full text-caption transition-all font-medium ${
              s.id === activeSignal
                ? "bg-primary text-white"
                : "bg-surface-tile-2 text-body-muted hover:text-white"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Detail & Code */}
      <div className="grid lg:grid-cols-2 gap-8 pt-6">
        <div className="space-y-4">
          <div>
            <span className="text-caption text-body-muted block">Detection Mechanism</span>
            <p className="text-body-strong text-white mt-1">{current.meaning}</p>
          </div>
          <div>
            <span className="text-caption text-body-muted block">Statistical Formulation</span>
            <code className="text-caption font-mono text-primary-on-dark block mt-1 bg-surface-tile-2 p-2.5 rounded-lg border border-ink-muted-80/30">
              {current.math}
            </code>
          </div>
          <div className="p-4 rounded-xl bg-surface-tile-2 border border-ink-muted-80/30">
            <span className="text-caption text-body-muted block mb-1">Why this matters:</span>
            <p className="text-caption text-body-muted leading-relaxed">
              In attacks like xz-utils (CVE-2024-3094), traditional SAST/DAST tools looked only at the raw code syntax and missed the months of maintainer coercion and sudden account behavior shifts. This SQL query catches the human takeover weeks in advance.
            </p>
          </div>
        </div>

        {/* SQL Code Block */}
        <div className="relative">
          <div className="flex items-center justify-between px-4 py-2 bg-surface-black rounded-t-xl border border-b-0 border-ink-muted-80/40 text-xs text-body-muted font-mono">
            <span>sql/04_behavior_signals.sql</span>
            <span>Postgres / Snowflake</span>
          </div>
          <pre className="p-4 bg-surface-black text-white text-[12px] font-mono leading-relaxed rounded-b-xl border border-ink-muted-80/40 overflow-x-auto max-h-[300px]">
            {current.sqlSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
