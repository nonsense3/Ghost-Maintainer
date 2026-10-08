"use client";

interface RiskGaugeProps {
  score: number;
  band: string;
}

export function RiskGauge({ score, band }: RiskGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const isHigh = normalizedScore > 66;
  const isMed = normalizedScore > 33 && normalizedScore <= 66;
  const isLow = normalizedScore <= 33;

  // Arc math: semi-circle radius 75 in viewBox 0 0 200 120
  const arcLength = Math.PI * 75; // ~235.62
  const progressOffset = arcLength * (1 - normalizedScore / 100);

  const colors = isHigh
    ? {
        from: "#ef4444",
        to: "#dc2626",
        text: "text-red-400",
        badgeBg: "bg-red-500/10 border-red-500/30 text-red-400",
        label: "Critical Hijack / Burnout Risk",
        desc: "Significant anomalous telemetry or severe maintainer fatigue detected.",
      }
    : isMed
      ? {
          from: "#f59e0b",
          to: "#f97316",
          text: "text-amber-400",
          badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          label: "Elevated Risk Strain",
          desc: "Noticeable shifts in commit latency, contributor surge, or unreviewed PRs.",
        }
      : {
          from: "#10b981",
          to: "#06b6d4",
          text: "text-emerald-400",
          badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          label: "Low Risk (Healthy Baseline)",
          desc: "Standard developer contribution patterns with zero supply chain anomalies.",
        };

  return (
    <div className="store-utility-card flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-zinc-900/90 to-black/90 border border-zinc-800/80 shadow-2xl">
      {/* Background ambient glow */}
      <div
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${colors.from} 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 z-10">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Threat Evaluation
          </span>
          <h3 className="text-base font-semibold text-zinc-100">
            Hijack & Burnout Risk
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.badgeBg}`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: colors.from }}
          />
          {band ? band.toUpperCase() : "EVALUATED"}
        </span>
      </div>

      {/* Radial Speedometer Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2 z-10">
        <svg
          viewBox="0 0 200 125"
          className="w-56 h-36 max-w-full drop-shadow-md overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="gaugeActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background muted track */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="url(#gaugeActiveGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={progressOffset}
            filter="url(#gaugeGlow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Ticks at 0, 33, 66, 100 */}
          <circle cx="25" cy="105" r="2.5" fill="rgba(255,255,255,0.4)" />
          <circle cx="53" cy="48" r="2" fill="rgba(255,255,255,0.3)" />
          <circle cx="147" cy="48" r="2" fill="rgba(255,255,255,0.3)" />
          <circle cx="175" cy="105" r="2.5" fill="rgba(255,255,255,0.4)" />
        </svg>

        {/* Central Display */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-5xl font-extrabold tracking-tight tabular-nums ${colors.text}`}
            >
              {normalizedScore}
            </span>
            <span className="text-zinc-500 font-semibold text-sm">/100</span>
          </div>
          <span className="text-[12px] font-medium text-zinc-300 mt-0.5">
            {colors.label}
          </span>
        </div>
      </div>

      {/* Segmented Bands Status */}
      <div className="mt-3 pt-3 border-t border-zinc-800/60 z-10">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div
            className={`py-1.5 px-2 rounded-lg border transition-all ${
              isLow
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm"
                : "bg-zinc-900/40 border-zinc-800/50 text-zinc-500"
            }`}
          >
            <span>0 - 33 Low</span>
          </div>
          <div
            className={`py-1.5 px-2 rounded-lg border transition-all ${
              isMed
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-sm"
                : "bg-zinc-900/40 border-zinc-800/50 text-zinc-500"
            }`}
          >
            <span>34 - 66 Med</span>
          </div>
          <div
            className={`py-1.5 px-2 rounded-lg border transition-all ${
              isHigh
                ? "bg-red-500/15 border-red-500/40 text-red-300 font-semibold shadow-sm"
                : "bg-zinc-900/40 border-zinc-800/50 text-zinc-500"
            }`}
          >
            <span>67 - 100 High</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 text-center mt-2 font-light">
          Formula: 0.5 × Gemma 4B Linguistic + 0.5 × SQL Git Velocity
        </p>
      </div>
    </div>
  );
}
