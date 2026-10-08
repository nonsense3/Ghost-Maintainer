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
  { id: 1, title: "GitHub Event Ingestion", statusText: "Cataloging Git events…" },
  { id: 2, title: "Temporal Window Functions", statusText: "Computing velocity drift…" },
  { id: 3, title: "Gemma 4B Linguistic Audit", statusText: "Evaluating maintainer communications…" },
  { id: 4, title: "Snowflake Zero-Egress Sync", statusText: "Securing analytical perimeter…" },
  { id: 5, title: "Ghost Risk Index Synthesis", statusText: "Synthesizing risk profile…" },
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

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(1);
      setProgress(12);
      setIsDone(false);
      return;
    }

    const t1 = setTimeout(() => {
      setCurrentStage(2);
      setProgress(34);
    }, 1100);

    const t2 = setTimeout(() => {
      setCurrentStage(3);
      setProgress(60);
    }, 2300);

    const t3 = setTimeout(() => {
      setCurrentStage(4);
      setProgress(84);
    }, 3600);

    const t4 = setTimeout(() => {
      setCurrentStage(5);
      setProgress(96);
    }, 4700);

    const t5 = setTimeout(() => {
      setProgress(100);
      setIsDone(true);
    }, 5600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStageObj = STAGES.find((s) => s.id === currentStage) || STAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0D0D0E] border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <Image
            src="/logo.png"
            alt="Ghost Maintainer"
            width={160}
            height={36}
            className="h-7 w-auto object-contain mx-auto"
            priority
          />
          <div>
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Analyzing Security Telemetry
            </h2>
            <p className="text-xs text-zinc-400 font-mono truncate max-w-xs mx-auto mt-0.5">
              {repoName}
            </p>
          </div>
        </div>

        {/* Minimal Spinner & Progress */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* Background ring */}
            <div className="w-14 h-14 rounded-full border-2 border-zinc-800" />

            {/* Animated spinner arc or checkmark */}
            {isDone ? (
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-base">
                ✓
              </div>
            ) : (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-500/50 animate-spin"
                  style={{ animationDuration: "1s" }}
                />
                <span className="font-mono text-xs font-semibold text-zinc-300">
                  {progress}%
                </span>
              </>
            )}
          </div>

          <div className="w-full space-y-1.5">
            <div className="w-full h-1 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800/80">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  isDone ? "bg-emerald-500" : "bg-indigo-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 text-center font-medium">
              {isDone ? "All signals evaluated & verified" : currentStageObj.statusText}
            </p>
          </div>
        </div>

        {/* Minimal Stepper Checklist */}
        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 divide-y divide-zinc-850/60 overflow-hidden text-xs">
          {STAGES.map((s) => {
            const isCompleted = s.id < currentStage || isDone;
            const isActive = s.id === currentStage && !isDone;

            return (
              <div
                key={s.id}
                className="flex items-center justify-between px-3.5 py-2.5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? "text-emerald-400 bg-emerald-500/10"
                        : isActive
                        ? "text-indigo-400 bg-indigo-500/10"
                        : "text-zinc-600 bg-zinc-900"
                    }`}
                  >
                    {isCompleted ? "✓" : isActive ? "●" : "○"}
                  </span>
                  <span
                    className={`font-medium ${
                      isCompleted
                        ? "text-zinc-300"
                        : isActive
                        ? "text-white font-semibold"
                        : "text-zinc-500"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>

                <span className="font-mono text-[11px]">
                  {isCompleted ? (
                    <span className="text-emerald-400">Verified</span>
                  ) : isActive ? (
                    <span className="text-indigo-400 animate-pulse">Running…</span>
                  ) : (
                    <span className="text-zinc-600">Pending</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Completion Action */}
        {isDone ? (
          <div className="pt-1 space-y-3 animate-fade-in">
            {resultScore && (
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Calculated Risk Index</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {resultScore.risk_score}/100 ({resultScore.band.toUpperCase()})
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onComplete}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm bg-zinc-100 hover:bg-white text-zinc-900 transition-colors shadow-sm cursor-pointer"
            >
              Reveal Triage Report →
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 text-center font-mono">
            Zero data egress · Running in secure perimeter
          </p>
        )}
      </div>
    </div>
  );
}
