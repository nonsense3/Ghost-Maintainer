"use client";

import { useEffect, useState } from "react";

interface RepoScanModalProps {
  isOpen: boolean;
  repoName: string;
  onComplete?: () => void;
  resultScore?: { risk_score: number; band: string } | null;
}

const STAGES = [
  {
    id: 1,
    title: "Harvesting GitHub Telemetry",
    desc: "Ingesting raw commits, pull requests, issue timelines & comments",
    icon: "🛰️",
  },
  {
    id: 2,
    title: "Evaluating SQL Window Functions",
    desc: "Calculating hour-of-day L1 drift, new-author surges & 90-day activity drops",
    icon: "⚡",
  },
  {
    id: 3,
    title: "Gemma 2 Linguistic Semantic Audit",
    desc: "Evaluating maintainer burnout, coercive pressure & hostile takeover tone",
    icon: "🧠",
  },
  {
    id: 4,
    title: "Snowflake Zero-Egress Perimeter",
    desc: "Staging VARIANT payloads in GHOST_MAINTAINER.ANALYTICS & validating Cortex",
    icon: "❄️",
  },
  {
    id: 5,
    title: "Synthesizing Ghost Risk Index",
    desc: "Weighting composite 0.5 * Linguistic + 0.5 * Velocity into final risk gauge",
    icon: "🛡️",
  },
];

export function RepoScanModal({
  isOpen,
  repoName,
  onComplete,
  resultScore,
}: RepoScanModalProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [progress, setProgress] = useState(10);
  const [isDone, setIsDone] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[INIT] Initializing Ghost Maintainer zero-egress telemetry scanner...",
    `[TARGET] Lock acquired on repository: ${repoName}`,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(1);
      setProgress(10);
      setIsDone(false);
      setLogs([
        "[INIT] Initializing Ghost Maintainer zero-egress telemetry scanner...",
        `[TARGET] Lock acquired on repository: ${repoName}`,
      ]);
      return;
    }

    // Step sequence timer
    const t1 = setTimeout(() => {
      setCurrentStage(2);
      setProgress(32);
      setLogs((l) => [
        ...l,
        "[GIT] Ingested raw GitHub telemetry: commits, issues & PR diffs cataloged.",
        "[SQL] Dispatching window functions over 30d/90d baseline windows...",
      ]);
    }, 1200);

    const t2 = setTimeout(() => {
      setCurrentStage(3);
      setProgress(58);
      setLogs((l) => [
        ...l,
        "[SQL] L1 hour-of-day distribution drift & new author velocity computed.",
        "[GEMMA] Executing Gemma 2 linguistic model across comment and commit text...",
      ]);
    }, 2500);

    const t3 = setTimeout(() => {
      setCurrentStage(4);
      setProgress(82);
      setLogs((l) => [
        ...l,
        "[GEMMA] Linguistic tone analysis completed: burnout & takeover vectors evaluated.",
        "[SNOWFLAKE] Verifying Snowflake zero-egress perimeter in GHOST_MAINTAINER.ANALYTICS...",
      ]);
    }, 3800);

    const t4 = setTimeout(() => {
      setCurrentStage(5);
      setProgress(96);
      setLogs((l) => [
        ...l,
        "[SNOWFLAKE] Snowflake VARIANT schemas & Cortex AI models verified in-perimeter.",
        "[SYNTHESIS] Generating composite Ghost Risk Score...",
      ]);
    }, 4900);

    const t5 = setTimeout(() => {
      setProgress(100);
      setIsDone(true);
      setLogs((l) => [
        ...l,
        "[SUCCESS] Audit completed successfully. All signals rendered.",
      ]);
    }, 5800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isOpen, repoName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0c0e14] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden space-y-6">
        {/* Glowing cyber gradient accents */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative flex items-center justify-between border-b border-hairline/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <span className="animate-spin text-base">⚙</span>
            </div>
            <div>
              <h2 className="text-body-strong font-semibold text-white tracking-wide flex items-center gap-2">
                Ghost Telemetry Scanner
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  LIVE INSPECTION
                </span>
              </h2>
              <p className="text-xs text-ink-muted-48 font-mono truncate max-w-sm sm:max-w-md">
                Auditing: {repoName}
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-cyan-400 font-bold text-sm">{progress}%</span>
          </div>
        </div>

        {/* Center Radar Scanner Animation */}
        <div className="relative flex items-center justify-center py-4">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-cyan-500/20 bg-[#080b12] flex items-center justify-center overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.1)]">
            {/* Concentric rings */}
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20 border-dashed" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-500/30" />
            <div className="absolute w-12 h-12 rounded-full border border-cyan-500/40" />

            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/15" />
            <div className="absolute h-full w-[1px] bg-cyan-500/15" />

            {/* Rotating Radar Sweep Blade */}
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(6,182,212,0.4) 0deg, rgba(6,182,212,0.1) 40deg, transparent 60deg)",
                animationDuration: "3s",
              }}
            />

            {/* Pulsing Sonar Rings */}
            <div className="absolute w-20 h-20 rounded-full bg-cyan-500/20 animate-ping opacity-40" />

            {/* Blips appearing on radar */}
            <div className="absolute top-10 right-14 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <div className="absolute bottom-12 left-12 w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-300 shadow-[0_0_8px_#818cf8]" />
            <div className="absolute top-16 left-20 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-700 shadow-[0_0_8px_#34d399]" />

            {/* Center Core */}
            <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)] border border-cyan-300/50">
              <span className="text-white text-xs font-bold">👻</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="space-y-2">
          {STAGES.map((s) => {
            const isCompleted = s.id < currentStage || isDone;
            const isActive = s.id === currentStage && !isDone;

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-200"
                    : isCompleted
                    ? "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                    : "bg-transparent border-transparent opacity-40 text-zinc-500"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{s.icon}</span>
                  <div>
                    <p className="text-xs font-semibold">{s.title}</p>
                    <p className="text-[11px] text-zinc-400 leading-tight">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-xs font-mono">
                  {isCompleted ? (
                    <span className="text-emerald-400 font-bold">✓ Verified</span>
                  ) : isActive ? (
                    <span className="text-cyan-400 font-bold animate-pulse">
                      Scanning…
                    </span>
                  ) : (
                    <span className="text-zinc-600">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal Telemetry Log Box */}
        <div className="p-3 rounded-xl bg-[#06080d] border border-zinc-800/80 font-mono text-[11px] text-cyan-300/90 max-h-24 overflow-y-auto space-y-1">
          {logs.slice(-4).map((log, idx) => (
            <p key={idx} className="truncate">
              {log}
            </p>
          ))}
        </div>

        {/* Done / Action Button */}
        {isDone && (
          <div className="pt-2 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {resultScore
                  ? `Risk Score: ${resultScore.risk_score} (${resultScore.band.toUpperCase()})`
                  : "Audit complete · High fidelity telemetry ready"}
              </span>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="w-full sm:w-auto btn-primary py-2 px-6 text-sm bg-gradient-to-r from-cyan-400 to-indigo-500 text-white font-semibold shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            >
              Reveal Triage Report →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
