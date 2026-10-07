"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RepoScanModal } from "./repo-scan-modal";

export function AddRepoForm() {

  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-detect and parse GitHub URLs or slash notation
  function resolveTarget(): { owner: string; name: string } | null {
    const raw = isUrlMode ? urlInput.trim() : `${owner.trim()} ${name.trim()}`;
    if (!raw) return null;

    // Check for full GitHub URL
    const urlMatch = raw.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+)/i);
    if (urlMatch) {
      return {
        owner: urlMatch[1],
        name: urlMatch[2].replace(/\.git$/i, ""),
      };
    }

    // Check for owner/name format
    if (raw.includes("/")) {
      const parts = raw.split(/[\s/]+/).filter(Boolean);
      if (parts.length >= 2) {
        return {
          owner: parts[0],
          name: parts[1].replace(/\.git$/i, ""),
        };
      }
    }

    if (owner.trim() && name.trim()) {
      return {
        owner: owner.trim(),
        name: name.trim().replace(/\.git$/i, ""),
      };
    }

    return null;
  }

  const detected = resolveTarget();
  const [showModal, setShowModal] = useState(false);
  const [targetRepoName, setTargetRepoName] = useState("");
  const [ingestedRepoId, setIngestedRepoId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const target = resolveTarget();
    if (!target || !target.owner || !target.name) {
      setStatus("Please enter a valid GitHub repository URL (e.g. https://github.com/dasouvik122005/Weblytix) or owner and name.");
      setLoading(false);
      return;
    }

    const fullName = `${target.owner}/${target.name}`;
    setTargetRepoName(fullName);
    setShowModal(true);

    try {
      const res = await fetch("/api/repos/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: target.owner, name: target.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Ingestion failed");
        setShowModal(false);
        return;
      }
      setStatus(`Ingested ${data.ingested_events} events for ${data.full_name}.`);
      setIngestedRepoId(data.repository_id);
      setUrlInput("");
      setOwner("");
      setName("");

      // Automatically trigger initial Gemma & SQL analysis in background
      if (data.repository_id) {
        fetch(`/api/repos/${data.repository_id}/analyze`, { method: "POST" }).catch(() => {});
      }
    } catch {
      setStatus("Network connection error. Please try again.");
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }

  function handleScanComplete() {
    setShowModal(false);
    router.refresh();
    if (ingestedRepoId) {
      router.push(`/dashboard/repos/${ingestedRepoId}`);
    }
  }

  function handleUrlChange(val: string) {
    setUrlInput(val);
    const match = val.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+)/i);
    if (match) {
      setOwner(match[1]);
      setName(match[2].replace(/\.git$/i, ""));

    }
  }

  return (
    <form onSubmit={onSubmit} className="store-utility-card space-y-4 p-6 bg-canvas rounded-2xl border border-hairline">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-body-strong text-ink font-semibold">Track a repository</h2>
          <p className="text-caption text-ink-muted-48">
            Public GitHub telemetry ingestion. Token remains secure on server.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-xs text-primary hover:underline font-medium"
        >
          {isUrlMode ? "Switch to Owner/Repo fields" : "Switch to Paste URL"}
        </button>
      </div>

      {isUrlMode ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="search-input flex-1 py-2.5 px-4 font-mono text-sm"
            placeholder="Paste GitHub URL: https://github.com/dasouvik122005/Weblytix or owner/repo"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-primary shrink-0 py-2.5 px-6"
            disabled={loading || !detected}
          >
            {loading ? "Fetching…" : "Add & ingest"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="search-input flex-1 py-2.5 px-4 font-mono text-sm"
            placeholder="GitHub handle (e.g. dasouvik122005)"
            value={owner}
            onChange={(e) => {
              const val = e.target.value;
              setOwner(val);
              handleUrlChange(val);
            }}
            required
          />
          <input
            className="search-input flex-1 py-2.5 px-4 font-mono text-sm"
            placeholder="Repository name (e.g. Weblytix)"
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              handleUrlChange(val);
            }}
            required
          />
          <button
            type="submit"
            className="btn-primary shrink-0 py-2.5 px-6"
            disabled={loading || !detected}
          >
            {loading ? "Fetching…" : "Add & ingest"}
          </button>
        </div>
      )}

      {/* Target Preview Indicator */}
      {detected && (
        <div className="flex items-center gap-2 text-xs text-ink-muted-80 bg-surface px-3 py-1.5 rounded-lg border border-hairline w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Detected Target:</span>
          <span className="font-mono font-semibold text-ink">
            {detected.owner} / {detected.name}
          </span>
        </div>
      )}

      {status && (
        <p
          className={`text-caption p-3 rounded-xl border ${
            status.startsWith("Ingested")
              ? "text-emerald-800 bg-emerald-50 border-emerald-200"
              : "text-red-700 bg-red-50 border-red-200"
          }`}
          role="status"
        >
          {status}
        </p>
      )}

      <RepoScanModal
        isOpen={showModal}
        repoName={targetRepoName || "Repository"}
        onComplete={handleScanComplete}
      />
    </form>
  );
}

