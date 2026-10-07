type Point = { week_start: string; risk_score: number };

export function RiskTrend({ history }: { history: Point[] }) {
  if (!history.length) {
    return (
      <div className="store-utility-card">
        <p className="text-body-strong text-ink mb-2">Trend</p>
        <p className="text-caption text-ink-muted-48">
          Run analysis weekly to build a trend line.
        </p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) =>
    a.week_start.localeCompare(b.week_start),
  );
  const max = Math.max(...sorted.map((p) => p.risk_score), 1);

  return (
    <div className="store-utility-card">
      <p className="text-body-strong text-ink mb-4">Risk over time</p>
      <div className="flex items-end gap-2 h-32">
        {sorted.map((p) => (
          <div key={p.week_start} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-sm bg-primary/80 min-h-[4px]"
              style={{ height: `${(p.risk_score / max) * 100}%` }}
              title={`${p.week_start}: ${p.risk_score}`}
            />
            <span className="text-micro-legal text-ink-muted-48 text-[10px] rotate-0 truncate max-w-full">
              {p.week_start.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
