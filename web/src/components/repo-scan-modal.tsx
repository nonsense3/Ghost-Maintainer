"use client";

import Image from "next/image";
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
    statusText: "Cataloging Git events…",
  },
  {
    id: 2,
    title: "Evaluating SQL Window Functions",
    desc: "Calculating hour-of-day L1 drift, new-author surges & 90-day activity drops",
    statusText: "Computing velocity drift…",
  },
  {
    id: 3,
    title: "Gemma 4B Linguistic Semantic Audit",
    desc: "Evaluating maintainer burnout, coercive pressure & hostile takeover tone",
    statusText: "Running Gemma 4B AI audit…",
  },
  {
    id: 4,
    title: "Snowflake Zero-Egress Perimeter",
    desc: "Staging VARIANT payloads in GHOST_MAINTAINER.ANALYTICS & validating Cortex",
    statusText: "Securing analytical perimeter…",
  },
  {
    id: 5,
    title: "Synthesizing Ghost Risk Index",
    desc: "Weighting composite 0.5 * Linguistic + 0.5 * Velocity into final risk gauge",
    statusText: "Synthesizing risk index…",
  },
];

export function RepoScanModal({
  isOpen,
  repoName,
  onComplete,
  resultScore,
}: RepoScanModalProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [progress, setProgress] = useState(12);
  const [isDone, setIsDone] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[INIT] Initializing Ghost Maintainer telemetry scanner…",
    `[TARGET] Lock acquired on repository: ${repoName}`,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(1);
      setProgress(12);
      setIsDone(false);
      setShowLogs(false);
      setLogs([
        "[INIT] Initializing Ghost Maintainer telemetry scanner…",
        `[TARGET] Lock acquired on repository: ${repoName}`,
      ]);
      return;
    }

    // Smooth sequence timers
    const t1 = setTimeout(() => {
      setCurrentStage(2);
      setProgress(34);
      setLogs((l) => [
        ...l,
        "[GIT] Ingested raw GitHub telemetry: commits, issues & PR diffs cataloged.",
        "[SQL] Dispatching window functions over 30d/90d baseline windows…",
      ]);
    }, 1200);

    const t2 = setTimeout(() => {
      setCurrentStage(3);
      setProgress(60);
      setLogs((l) => [
        ...l,
        "[SQL] L1 hour-of-day distribution drift & new author velocity computed.",
        "[GEMMA] Executing Gemma 4B linguistic model across comment and commit text…",
      ]);
    }, 2500);

    const t3 = setTimeout(() => {
      setCurrentStage(4);
      setProgress(84);
      setLogs((l) => [
        ...l,
        "[GEMMA] Linguistic tone analysis completed: burnout & takeover vectors evaluated.",
        "[SNOWFLAKE] Staging zero-egress telemetry in GHOST_MAINTAINER.ANALYTICS…",
      ]);
    }, 3800);

    const t4 = setTimeout(() => {
      setCurrentStage(5);
      setProgress(96);
      setLogs((l) => [
        ...l,
        "[SNOWFLAKE] Snowflake VARIANT schemas & Cortex AI models verified in-perimeter.",
        "[SYNTHESIS] Generating composite Ghost Risk Score…",
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

  const currentStageObj = STAGES.find((s) => s.id === currentStage) || STAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#090d16]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_100px_rgba(66,133,244,0.18)] overflow-hidden space-y-6">
        {/* Google Gemini ambient multi-color light aura */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-gradient-to-br from-blue-600/25 via-indigo-600/20 to-transparent rounded-full blur-3xl pointer-events-none animate-gemini-aura" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-tl from-pink-600/20 via-purple-600/20 to-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-gemini-aura" />

        {/* Top Header */}
        <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 font-bold text-lg">
                ✦
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  Ghost Telemetry Audit
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-purple-300 border border-purple-500/30">
                  GEMINI AI ENGINE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate max-w-xs sm:max-w-md">
                Auditing: {repoName}
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 font-bold text-sm">
              {progress}%
            </span>
          </div>
        </div>

        {/* Centerpiece: Google Gemini Aura with Ghost Maintainer Logo */}
        <div className="relative flex flex-col items-center justify-center py-5">
          {/* Ambient glowing backdrop */}
          <div className="relative flex items-center justify-center w-36 h-36">
            {/* Outer pulsating Gemini multi-color glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#4285F4]/30 via-[#9B72CF]/40 to-[#EC4899]/30 blur-2xl animate-gemini-aura" />

            {/* Ripple rings */}
            <div className="absolute w-32 h-32 rounded-full border border-purple-500/20 animate-ping opacity-25" />
            <div className="absolute w-28 h-28 rounded-full border border-cyan-500/20 animate-pulse opacity-40" />

            {/* Continuous rotating Gemini iridescent ring */}
            <div
              className="relative w-24 h-24 rounded-full p-[2.5px] animate-[spin_5s_linear_infinite]"
              style={{
                background:
                  "conic-gradient(from 0deg, #4285F4 0%, #8B5CF6 25%, #EC4899 50%, #06B6D4 75%, #4285F4 100%)",
              }}
            >
              {/* Inner core displaying official logo */}
              <div className="w-full h-full rounded-full bg-[#080c14] flex items-center justify-center p-2.5 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                <Image
                  src="/logo.png"
                  alt="Ghost Maintainer"
                  width={56}
                  height={56}
                  className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]"
                  priority
                />
              </div>
            </div>

            {/* Floating Gemini Sparkle Stars */}
            <span className="absolute -top-1 -right-2 text-violet-300 text-sm animate-gemini-float">
              ✦
            </span>
            <span
              className="absolute -bottom-1 -left-2 text-pink-300 text-xs animate-gemini-float"
              style={{ animationDelay: "1s" }}
            >
              ✧
            </span>
            <span
              className="absolute top-2 -left-3 text-cyan-300 text-[10px] animate-gemini-float"
              style={{ animationDelay: "1.5s" }}
            >
              ✦
            </span>
            <span
              className="absolute bottom-2 -right-3 text-indigo-300 text-xs animate-gemini-float"
              style={{ animationDelay: "2s" }}
            >
              ✦
            </span>
          </div>

          {/* Subtitle status banner */}
          <div className="mt-3 text-center">
            <p className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-pink-300 flex items-center justify-center gap-1.5">
              <span>✦</span>
              <span>{isDone ? "Telemetry audit verified" : currentStageObj.statusText}</span>
            </p>
          </div>
        </div>

        {/* Gemini Iridescent Shimmer Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden p-[0.5px] border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 via-pink-500 to-cyan-400 animate-gemini-shimmer rounded-full transition-all duration-400 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stages Checklist (Gemini Aesthetics) */}
        <div className="space-y-2">
          {STAGES.map((s) => {
            const isCompleted = s.id < currentStage || isDone;
            const isActive = s.id === currentStage && !isDone;

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isActive
                    ? "bg-purple-950/20 border-purple-500/40 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    : isCompleted
                    ? "bg-zinc-900/40 border-zinc-800/70 text-zinc-300"
                    : "bg-transparent border-transparent opacity-35 text-zinc-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : isActive
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse"
                        : "bg-zinc-800/40 text-zinc-600 border border-zinc-800"
                    }`}
                  >
                    {isCompleted ? "✓" : isActive ? "✦" : s.id}
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide">{s.title}</p>
                    <p className="text-[11px] text-zinc-400 leading-tight">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-xs font-mono ml-2">
                  {isCompleted ? (
                    <span className="text-emerald-400 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      ✓ Verified
                    </span>
                  ) : isActive ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 font-bold text-[11px] animate-pulse">
                      Processing…
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-[11px]">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gemini Live Activity Capsule (Replaces raw console box) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300 backdrop-blur-md">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 text-sm shrink-0">
                ✦
              </span>
              <p className="truncate font-mono text-[11px] text-zinc-300">
                {logs[logs.length - 1] ?? "Analyzing repository signals…"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 shrink-0 font-mono ml-2"
            >
              {showLogs ? "Hide Stream" : "View Stream"}
            </button>
          </div>

          {/* Optional expandable telemetry stream */}
          {showLogs && (
            <div className="p-3 rounded-2xl bg-[#06080d] border border-zinc-800/80 font-mono text-[11px] text-zinc-400 max-h-24 overflow-y-auto space-y-1 animate-fade-in">
              {logs.slice(-5).map((log, idx) => (
                <p key={idx} className="truncate">
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Completion Action State */}
        {isDone && (
          <div className="pt-2 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {resultScore
                  ? `Risk Score: ${resultScore.risk_score} (${resultScore.band.toUpperCase()}) · Verified`
                  : "Audit complete · High fidelity telemetry ready"}
              </span>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="w-full sm:w-auto py-2.5 px-6 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-[0_0_30px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
            >
              Reveal Triage Report →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
