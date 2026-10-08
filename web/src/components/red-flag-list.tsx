type Flag = {
  event_id?: number;
  risk_score: number;
  reason?: string | null;
  signals?: string[] | unknown;
};

export function RedFlagList({ flags }: { flags: Flag[] }) {
  if (!flags.length) {
    return (
      <div className="store-utility-card space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-body-strong text-ink font-semibold">Security & Behavior Red Flags</h3>
        </div>
        <p className="text-caption text-ink-muted-48">
          Zero critical red flags or anomalous security deviations above threshold.
        </p>
      </div>
    );
  }

  return (
    <div className="store-utility-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-body-strong text-ink font-semibold">
            Security & Behavior Red Flags
          </h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-mono border border-red-500/20">
          {flags.length} Flagged
        </span>
      </div>

      <ul className="space-y-3">
        {flags.map((f, i) => {
          const isHigh = f.risk_score >= 70;
          const badgeClass = isHigh
            ? "text-red-400 bg-red-500/10 border-red-500/20"
            : "text-amber-400 bg-amber-500/10 border-amber-500/20";

          return (
            <li
              key={`${f.event_id ?? "b"}-${i}`}
              className="p-3.5 rounded-xl bg-canvas-parchment/60 border border-hairline/60 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${badgeClass}`}
                  >
                    Score {f.risk_score}
                  </span>
                  {Array.isArray(f.signals) &&
                    f.signals.map((sig, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize"
                      >
                        {String(sig).replaceAll("_", " ")}
                      </span>
                    ))}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted-48 font-mono">
                  {f.event_id && f.event_id > 0 ? "Code / Event" : "Velocity Signal"}
                </span>
              </div>
              {f.reason && (
                <p className="text-caption text-ink-muted-80 leading-relaxed font-sans">
                  {f.reason}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
