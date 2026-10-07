"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddRepoForm() {
  const router = useRouter();
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/repos/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: owner.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error ?? "Ingest failed");
        return;
      }
      setStatus(`Ingested ${data.ingested_events} events for ${data.full_name}.`);
      setOwner("");
      setName("");
      router.refresh();
      if (data.repository_id) {
        router.push(`/dashboard/repos/${data.repository_id}`);
      }
    } catch {
      setStatus("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="store-utility-card space-y-4">
      <h2 className="text-body-strong text-ink">Track a repository</h2>
      <p className="text-caption text-ink-muted-48">
        Public GitHub data only. Your token never leaves the server.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="search-input flex-1"
          placeholder="owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          required
        />
        <input
          className="search-input flex-1"
          placeholder="repo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading}>
          {loading ? "Fetching…" : "Add & ingest"}
        </button>
      </div>
      {status && (
        <p className="text-caption text-ink-muted-80" role="status">
          {status}
        </p>
      )}
    </form>
  );
}
