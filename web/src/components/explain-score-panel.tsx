"use client";

import { useState } from "react";

type ExplainRow = {
  risk_score: number;
  reason: string | null;
  signals: string[] | null;
};

export function ExplainScorePanel({ rows }: { rows: ExplainRow[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="store-utility-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-body-strong text-ink font-semibold">
            Linguistic Audit Breakdown
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">
            Gemma 4B · Track 1
          </span>
        </div>
        <button
          type="button"
          className="text-link text-caption"
          onClick={() => setOpen(!open)}
        >
          {open ? "Collapse" : `View ${rows.length} Scored Items`}
        </button>
      </div>

      {open && (
        <div className="space-y-3">
          {rows.length === 0 ? (
            <div className="p-4 rounded-xl bg-canvas-parchment/60 border border-hairline/60 text-center space-y-1.5">
              <p className="text-caption text-ink font-medium">
                No linguistic evaluations generated yet.
              </p>
              <p className="text-xs text-ink-muted-48">
                Click &ldquo;Run Security Analysis&rdquo; to execute the Gemma 4B linguistic model across GitHub comments, PR discussions, and commit messages.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {rows.map((r, i) => {
                const isHigh = r.risk_score >= 60;
                const isMed = r.risk_score >= 35 && r.risk_score < 60;
                const badgeColor = isHigh
                  ? "text-red-400 bg-red-500/10 border-red-500/20"
                  : isMed
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-canvas-parchment/80 border border-hairline/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          Score {r.risk_score}
                        </span>
                        {r.signals?.map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                          >
                            {sig.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    {r.reason && (
                      <p className="text-caption text-ink-muted-80 leading-relaxed">
                        {r.reason}
                      </p>
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

