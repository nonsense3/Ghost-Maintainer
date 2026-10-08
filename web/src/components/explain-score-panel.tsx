"use client";

import { useState } from "react";

export type ScoredAuditItem = {
  event_id: number;
  source: "commit" | "pr" | "issue" | "comment";
  external_id: string;
  author: string | null;
  occurred_at: string;
  title: string;
  html_url?: string | null;
  files?: Array<{
    filename: string;
    additions?: number;
    deletions?: number;
    status?: string;
    patch?: string;
  }>;
  codeSnippet?: string | null;
  risk_score: number;
  signals: string[];
  reason: string;
  model?: string | null;
};

// Fallback compatibility with previous rows prop format
type LegacyRow = {
  risk_score: number;
  reason: string | null;
  signals: string[] | null;
};

interface ExplainScorePanelProps {
  items?: ScoredAuditItem[];
  rows?: LegacyRow[];
  repoFullName?: string;
}

export function ExplainScorePanel({
  items,
  rows,
  repoFullName,
}: ExplainScorePanelProps) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<"all" | "flagged" | "clean">("all");
  const [expandedDiffs, setExpandedDiffs] = useState<Record<number, boolean>>({});

  // Normalize legacy rows to ScoredAuditItem format if necessary
  const normalizedItems: ScoredAuditItem[] = items && items.length > 0
    ? items
    : (rows ?? []).map((r, idx) => ({
        event_id: idx + 1,
        source: "commit",
        external_id: `evt-${idx + 1}`,
        author: "maintainer",
        occurred_at: new Date().toISOString(),
        title: r.reason ? r.reason.slice(0, 70) : "Scanned repository item",
        risk_score: r.risk_score,
        signals: r.signals ?? [],
        reason: r.reason ?? "Security evaluation completed.",
        codeSnippet: null,
      }));

  const flaggedCount = normalizedItems.filter((i) => i.risk_score >= 35).length;
  const cleanCount = normalizedItems.filter((i) => i.risk_score < 35).length;

  const filteredItems = normalizedItems.filter((item) => {
    if (filter === "flagged") return item.risk_score >= 35;
    if (filter === "clean") return item.risk_score < 35;
    return true;
  });

  const toggleDiff = (id: number) => {
    setExpandedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatShortSha = (source: string, id: string) => {
    if (source === "commit" && id.length >= 7) {
      return id.slice(0, 7);
    }
    return id;
  };

  const getCveBadge = (signals: string[]) => {
    if (signals.includes("cve_2024_3094_indicator") || signals.includes("unexplained_binary_injection")) {
      return {
        label: "⚠️ CVE-2024-3094 Backdoor Vector",
        className: "bg-red-500/15 text-red-400 border-red-500/30",
      };
    }
    if (signals.includes("cve_2020_28458_indicator") || signals.includes("malicious_lifecycle_script")) {
      return {
        label: "⚠️ CVE-2020-28458 Postinstall Script",
        className: "bg-red-500/15 text-red-400 border-red-500/30",
      };
    }
    if (signals.includes("owasp_a02_secret_leak") || signals.includes("credential_exposure")) {
      return {
        label: "⚠️ OWASP A02 Credential Leak",
        className: "bg-red-500/15 text-red-400 border-red-500/30",
      };
    }
    if (signals.includes("owasp_a03_injection_vector")) {
      return {
        label: "⚠️ OWASP A03 Injection Vector",
        className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      };
    }
    if (signals.includes("owasp_a07_verified")) {
      return {
        label: "✓ OWASP A07 Auth Verified",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    }
    if (signals.includes("cve_2024_3094_clean")) {
      return {
        label: "✓ CVE-2024-3094 Clean",
        className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      };
    }
    return null;
  };

  return (
    <div className="store-utility-card space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-body-strong text-ink font-semibold">
            Code Security & CVE Audit Breakdown
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">
            Gemma 4B · Track 1 & OWASP Inspector
          </span>
        </div>
        <button
          type="button"
          className="text-link text-caption text-left sm:text-right"
          onClick={() => setOpen(!open)}
        >
          {open ? "Collapse View" : `View ${normalizedItems.length} Scanned Artifacts`}
        </button>
      </div>

      {open && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 border-b border-hairline/60 pb-3 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg border transition-all ${
                filter === "all"
                  ? "bg-zinc-800 text-white border-zinc-600 font-semibold"
                  : "bg-zinc-900/50 text-zinc-400 border-hairline/60 hover:text-white"
              }`}
            >
              All Scanned ({normalizedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("flagged")}
              className={`px-3 py-1 rounded-lg border transition-all ${
                filter === "flagged"
                  ? "bg-red-500/20 text-red-300 border-red-500/40 font-semibold"
                  : "bg-zinc-900/50 text-zinc-400 border-hairline/60 hover:text-red-300"
              }`}
            >
              ⚠️ Flagged Issues ({flaggedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("clean")}
              className={`px-3 py-1 rounded-lg border transition-all ${
                filter === "clean"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                  : "bg-zinc-900/50 text-zinc-400 border-hairline/60 hover:text-emerald-300"
              }`}
            >
              ✓ Verified Clean ({cleanCount})
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-6 rounded-xl bg-canvas-parchment/60 border border-hairline/60 text-center space-y-2">
              <p className="text-caption text-ink font-medium">
                No items match the selected filter ({filter}).
              </p>
              <p className="text-xs text-ink-muted-48">
                Switch filters or click &ldquo;Run Security Analysis (Gemma)&rdquo; to evaluate repository telemetry.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const isHigh = item.risk_score >= 60;
                const isMed = item.risk_score >= 35 && item.risk_score < 60;
                const badgeColor = isHigh
                  ? "text-red-400 bg-red-500/10 border-red-500/30"
                  : isMed
                  ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

                const cveBadge = getCveBadge(item.signals);
                const shortSha = formatShortSha(item.source, item.external_id);
                const isDiffOpen = !!expandedDiffs[item.event_id];

                return (
                  <div
                    key={item.event_id}
                    className="p-4 rounded-xl bg-canvas-parchment/80 border border-hairline/70 space-y-3 hover:border-hairline transition-colors"
                  >
                    {/* Top Row: Meta & Risk Score */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline/40 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 uppercase font-semibold text-[10px]">
                          {item.source}
                        </span>

                        {item.html_url ? (
                          <a
                            href={item.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-2 flex items-center gap-1"
                          >
                            <span>{shortSha}</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        ) : repoFullName && item.source === "commit" ? (
                          <a
                            href={`https://github.com/${repoFullName}/commit/${item.external_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-2 flex items-center gap-1"
                          >
                            <span>{shortSha}</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        ) : (
                          <span className="text-zinc-300 font-bold">{shortSha}</span>
                        )}

                        {item.author && (
                          <span className="text-zinc-400">
                            by <span className="text-zinc-200 font-medium">@{item.author}</span>
                          </span>
                        )}

                        {item.occurred_at && (
                          <span className="text-zinc-500 text-[11px]">
                            · {new Date(item.occurred_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {cveBadge && (
                          <span
                            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${cveBadge.className}`}
                          >
                            {cveBadge.label}
                          </span>
                        )}
                        <span
                          className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded border ${badgeColor}`}
                        >
                          {isHigh
                            ? `Score ${item.risk_score} · Critical`
                            : isMed
                            ? `Score ${item.risk_score} · Moderate`
                            : `✓ Score ${item.risk_score} · Clean`}
                        </span>
                      </div>
                    </div>

                    {/* Commit Title / Message */}
                    <div>
                      <p className="text-sm font-semibold text-ink leading-snug">
                        {item.title}
                      </p>
                    </div>

                    {/* Files Scanned Badges */}
                    {item.files && item.files.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                        <span className="text-ink-muted-48 text-[11px] font-sans">
                          Files Audited:
                        </span>
                        {item.files.slice(0, 4).map((f, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700/60 text-[11px]"
                          >
                            {f.filename}
                            {typeof f.additions === "number" && (
                              <span className="text-emerald-400 ml-1">+{f.additions}</span>
                            )}
                            {typeof f.deletions === "number" && (
                              <span className="text-red-400 ml-0.5">-{f.deletions}</span>
                            )}
                          </span>
                        ))}
                        {item.files.length > 4 && (
                          <span className="text-ink-muted-48 text-[11px]">
                            +{item.files.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Security & CVE Evaluation Explanation */}
                    <div className="p-3 rounded-lg bg-black/40 border border-hairline/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-ink-muted-48 tracking-wider">
                          Gemma Security & CVE Verdict
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.signals.map((sig, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize"
                            >
                              {sig.replaceAll("_", " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-caption text-ink-muted-80 leading-relaxed font-sans">
                        {item.reason}
                      </p>
                    </div>

                    {/* Scanned Code Diff Toggle */}
                    {(item.codeSnippet || (item.files && item.files.some((f) => f.patch))) && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleDiff(item.event_id)}
                          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition-colors"
                        >
                          <span>{isDiffOpen ? "▾ Hide Scanned Code & Diff" : "▸ View Scanned Code Diff"}</span>
                        </button>

                        {isDiffOpen && (
                          <div className="mt-2 p-3 rounded-lg bg-zinc-950 border border-hairline overflow-x-auto text-[11px] font-mono text-zinc-300 leading-relaxed max-h-[220px]">
                            {item.files && item.files.some((f) => f.patch) ? (
                              item.files
                                .filter((f) => f.patch)
                                .map((f, pIdx) => (
                                  <div key={pIdx} className="mb-3 last:mb-0">
                                    <div className="text-zinc-500 border-b border-zinc-800 pb-1 mb-1 font-bold">
                                      --- {f.filename} ---
                                    </div>
                                    <pre className="whitespace-pre-wrap font-mono">
                                      {f.patch?.split("\n").map((line, lIdx) => {
                                        const isAdd = line.startsWith("+");
                                        const isDel = line.startsWith("-");
                                        const isHeader = line.startsWith("@@");
                                        const color = isAdd
                                          ? "text-emerald-400 bg-emerald-950/20"
                                          : isDel
                                          ? "text-red-400 bg-red-950/20"
                                          : isHeader
                                          ? "text-cyan-400"
                                          : "text-zinc-300";
                                        return (
                                          <div key={lIdx} className={color}>
                                            {line}
                                          </div>
                                        );
                                      })}
                                    </pre>
                                  </div>
                                ))
                            ) : item.codeSnippet ? (
                              <pre className="whitespace-pre-wrap font-mono text-zinc-300">
                                {item.codeSnippet}
                              </pre>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
