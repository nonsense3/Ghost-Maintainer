"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeButton({ repositoryId }: { repositoryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/repos/${repositoryId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Analysis failed");
        return;
      }
      setMessage(
        `Risk ${data.risk_score} (${data.band}) — scored ${data.scored_comments} new comments.`,
      );
      router.refresh();
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Analyzing…" : "Run analysis"}
      </button>
      {message && (
        <p className="text-caption text-ink-muted-80" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
