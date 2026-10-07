"use client";

import { useState } from "react";

type ExplainRow = {
  risk_score: number;
  reason: string | null;
  signals: string[] | null;
};

export function ExplainScorePanel({ rows }: { rows: ExplainRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="store-utility-card">
      <button
        type="button"
        className="text-link text-body-strong"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide" : "Explain this score"}
      </button>
      {open && (
        <ul className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <li className="text-caption text-ink-muted-48">
              No linguistic scores yet — run analysis with Ollama running locally.
            </li>
          ) : (
            rows.map((r, i) => (
              <li key={i} className="text-caption text-ink-muted-80">
                <span className="text-caption-strong text-ink">
                  {r.risk_score}
                </span>
                {r.signals?.length ? ` — ${r.signals.join("; ")}` : ""}
                {r.reason ? `: ${r.reason}` : ""}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
