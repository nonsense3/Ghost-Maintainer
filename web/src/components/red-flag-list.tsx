type Flag = {
  event_id?: number;
  risk_score: number;
  reason?: string | null;
  signals?: string[] | unknown;
};

export function RedFlagList({ flags }: { flags: Flag[] }) {
  if (!flags.length) {
    return (
      <div className="store-utility-card">
        <p className="text-body-strong text-ink mb-2">Red flags</p>
        <p className="text-caption text-ink-muted-48">None above threshold yet.</p>
      </div>
    );
  }

  return (
    <div className="store-utility-card">
      <p className="text-body-strong text-ink mb-4">Red flags</p>
      <ul className="space-y-3">
        {flags.map((f, i) => (
          <li
            key={`${f.event_id ?? "b"}-${i}`}
            className="border-t border-divider-soft pt-3 first:border-0 first:pt-0"
          >
            <p className="text-caption-strong text-ink">
              Score {f.risk_score}
              {Array.isArray(f.signals) && f.signals.length > 0 && (
                <span className="text-ink-muted-48 font-normal">
                  {" "}
                  · {f.signals.join(", ")}
                </span>
              )}
            </p>
            {f.reason && (
              <p className="text-caption text-ink-muted-80 mt-1">{f.reason}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
