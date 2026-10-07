export function RiskGauge({
  score,
  band,
}: {
  score: number;
  band: string;
}) {
  const color =
    band === "high"
      ? "#cc3300"
      : band === "medium"
        ? "#996600"
        : "var(--color-primary)";

  return (
    <div className="store-utility-card text-center">
      <p className="text-caption text-ink-muted-48 mb-2">Hijack / burnout risk</p>
      <p
        className="text-hero tabular-nums"
        style={{ color, fontSize: "56px" }}
      >
        {score}
      </p>
      <p className="text-tagline text-ink-muted-80 capitalize">{band} band</p>
      <div className="mt-6 h-2 rounded-full bg-divider-soft overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
