"use client";

import Link from "next/link";
import { useState } from "react";

export type RepoRiskData = {
  risk_score: number;
  band: string;
  linguistic_score?: number;
  velocity_score?: number;
  red_flags?: unknown;
};

interface TrackedRepoCardProps {
  repo: {
    id: string;
    full_name: string;
    created_at: string;
  };
  initialRisk?: RepoRiskData | null;
  eventCount?: number;
}

export function TrackedRepoCard({
  repo,
  initialRisk,
  eventCount,
}: TrackedRepoCardProps) {
  const [risk, setRisk] = useState<RepoRiskData | null>(initialRisk ?? null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const isAnalyzed = risk !== null && typeof risk.risk_score === "number";
  const score = isAnalyzed ? risk.risk_score : null;

  const isHigh = score !== null && score >= 67;
  const isMed = score !== null && score >= 34 && score < 67;
  const isClean = score !== null && score < 34;

  const statusBadge = !isAnalyzed ? (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
      ⏳ Ready to Scan
    </span>
  ) : isHigh ? (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-mono border border-red-500/30 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      🚨 Action Required
    </span>
  ) : isMed ? (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono border border-amber-500/30 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      ⚠️ Review Recommended
    </span>
  ) : (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      ✓ Secure & Healthy
    </span>
  );

  const plainSummary = !isAnalyzed
    ? "Connected to GitHub. Click 'Scan Now' to run security and maintainer health audit."
    : isHigh
    ? "Critical supply chain or maintainer takeover indicators flagged. Inspect scanned items immediately."
    : isMed
    ? "Moderate activity lull or contributor changes detected. Review recommended before merging external PRs."
    : "Zero critical CVE vulnerabilities or secret leaks found. Maintainer activity is nominal.";

  async function handleQuickScan(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsScanning(true);
    setScanMessage(null);

    try {
      const res = await fetch(`/api/repos/${repo.id}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setRisk({
          risk_score: data.risk_score,
          band: data.band,
          linguistic_score: data.linguistic_score,
          velocity_score: data.velocity_score,
          red_flags: data.red_flags,
        });
        setScanMessage("✓ Audit completed");
        setTimeout(() => setScanMessage(null), 3500);
      } else {
        setScanMessage("Could not scan right now. Try again.");
      }
    } catch {
      setScanMessage("Connection error. Try again.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-canvas border border-hairline hover:border-zinc-700 transition-all flex flex-col justify-between gap-4 group">
      {/* Top: Repo Name & Status Badge */}
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/dashboard/repos/${repo.id}`}
            className="text-base font-semibold text-ink group-hover:text-primary transition-colors truncate"
            title={repo.full_name}
          >
            {repo.full_name}
          </Link>
          {statusBadge}
        </div>

        {/* Plain English explanation */}
        <p className="text-caption text-ink-muted-80 leading-relaxed font-sans">
          {plainSummary}
        </p>
      </div>

      {/* Middle Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
        <div className="p-2.5 rounded-xl bg-surface-raised border border-hairline/60">
          <p className="text-[10px] uppercase text-ink-muted-48 tracking-wider font-sans">
            Risk Index
          </p>
          <p className="text-sm font-semibold text-ink mt-0.5">
            {score !== null ? (
              <>
                {score}
                <span className="text-[11px] text-ink-muted-48 font-normal"> / 100</span>
              </>
            ) : (
              <span className="text-zinc-500 font-normal">Pending</span>
            )}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-raised border border-hairline/60">
          <p className="text-[10px] uppercase text-ink-muted-48 tracking-wider font-sans">
            Security Status
          </p>
          <p className="text-sm font-semibold text-ink mt-0.5 truncate">
            {score !== null ? (
              isClean ? (
                <span className="text-emerald-400">Clean</span>
              ) : isMed ? (
                <span className="text-amber-400">Review</span>
              ) : (
                <span className="text-red-400">Threat</span>
              )
            ) : typeof eventCount === "number" && eventCount > 0 ? (
              <span className="text-zinc-300">{eventCount} Events</span>
            ) : (
              <span className="text-zinc-500">Unscored</span>
            )}
          </p>
        </div>
      </div>

      {/* Bottom Actions: Scan Button + Details Link */}
      <div className="flex items-center justify-between pt-2 border-t border-hairline/50">
        <Link
          href={`/dashboard/repos/${repo.id}`}
          className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
        >
          <span>View Audit Report</span>
          <span className="text-[11px]">→</span>
        </Link>

        <button
          type="button"
          onClick={handleQuickScan}
          disabled={isScanning}
          className="text-xs py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors font-mono cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full border border-t-transparent border-cyan-400 animate-spin" />
              <span>Auditing…</span>
            </>
          ) : (
            <span>{isAnalyzed ? "Re-scan" : "Scan Now"}</span>
          )}
        </button>
      </div>

      {scanMessage && (
        <p className="text-[11px] text-emerald-400 font-mono text-center -mt-2 animate-fade-in">
          {scanMessage}
        </p>
      )}
    </div>
  );
}
