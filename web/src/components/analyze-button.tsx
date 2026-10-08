"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RepoScanModal } from "./repo-scan-modal";

export function AnalyzeButton({
  repositoryId,
  repoName = "Repository",
}: {
  repositoryId: string;
  repoName?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scanResult, setScanResult] = useState<{
    risk_score: number;
    band: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setShowModal(true);
    setMessage(null);
    setScanResult(null);

    try {
      const res = await fetch(`/api/repos/${repositoryId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Analysis failed");
        return;
      }
      setScanResult({
        risk_score: data.risk_score,
        band: data.band,
      });
      setMessage(
        `Risk Score: ${data.risk_score} (${data.band.toUpperCase()}) — Evaluated via Gemma (4B) & SQL Behavior.`,
      );
    } catch {
      setMessage("Network error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  }

  function handleComplete() {
    setShowModal(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="btn-primary flex items-center gap-2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-indigo-600 text-white font-semibold py-2.5 px-6 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border-0 cursor-pointer"
        >
          <span className="text-base">⚡</span>
          <span>{loading ? "Scanning Telemetry…" : "Run Security Analysis (Gemma)"}</span>
        </button>

        {message && (
          <p className="text-caption font-mono text-cyan-300" role="status">
            {message}
          </p>
        )}
      </div>

      <RepoScanModal
        isOpen={showModal}
        repoName={repoName}
        resultScore={scanResult}
        onComplete={handleComplete}
      />
    </>
  );
}

