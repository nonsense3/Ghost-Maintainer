"""
Batch GitHub → Supabase / Cache Ingest (PRD fetcher/fetch_github.py).
Fetches commits, PRs, issues, and comments for the past 6 months and loads into
raw_github_events (or local JSON cache for rate-limit safety).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def get_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Ghost-Maintainer-Fetcher/1.0",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def github_get(path: str) -> list[Any] | dict[str, Any]:
    url = f"https://api.github.com{path}"
    resp = requests.get(url, headers=get_headers(), timeout=60)
    if resp.status_code == 403 and "rate limit" in resp.text.lower():
        print("[!] GitHub API rate limit reached. Set GITHUB_TOKEN in fetcher/.env", file=sys.stderr)
    resp.raise_for_status()
    return resp.json()


def fetch_repository_events(owner: str, name: str, months: int = 6) -> list[dict[str, Any]]:
    since = (datetime.now(timezone.utc) - timedelta(days=months * 30)).isoformat()
    events: list[dict[str, Any]] = []

    print(f"[*] Fetching commits for {owner}/{name} since {since}...")
    try:
        commits = github_get(f"/repos/{owner}/{name}/commits?since={since}&per_page=100")
        if isinstance(commits, list):
            for c in commits:
                events.append({
                    "source": "commit",
                    "external_id": c["sha"],
                    "occurred_at": c["commit"]["author"]["date"],
                    "payload": c,
                })
    except Exception as e:
        print(f"[!] Warning fetching commits: {e}")

    print(f"[*] Fetching pull requests for {owner}/{name}...")
    try:
        prs = github_get(f"/repos/{owner}/{name}/pulls?state=all&sort=updated&direction=desc&per_page=100")
        if isinstance(prs, list):
            for pr in prs:
                events.append({
                    "source": "pr",
                    "external_id": str(pr["id"]),
                    "occurred_at": pr.get("updated_at") or pr.get("created_at"),
                    "payload": pr,
                })
    except Exception as e:
        print(f"[!] Warning fetching PRs: {e}")

    print(f"[*] Fetching issues and comments for {owner}/{name}...")
    try:
        issues = github_get(f"/repos/{owner}/{name}/issues?state=all&sort=updated&direction=desc&per_page=100")
        if isinstance(issues, list):
            issues_only = [i for i in issues if "pull_request" not in i]
            for issue in issues_only:
                events.append({
                    "source": "issue",
                    "external_id": str(issue["id"]),
                    "occurred_at": issue.get("updated_at") or issue.get("created_at"),
                    "payload": issue,
                })

            for issue in issues_only[:20]:
                num = issue["number"]
                try:
                    comments = github_get(f"/repos/{owner}/{name}/issues/{num}/comments?per_page=100")
                    if isinstance(comments, list):
                        for comment in comments:
                            payload = dict(comment)
                            payload["issue_number"] = num
                            events.append({
                                "source": "comment",
                                "external_id": str(comment["id"]),
                                "occurred_at": comment.get("updated_at") or comment.get("created_at"),
                                "payload": payload,
                            })
                except Exception:
                    continue
    except Exception as e:
        print(f"[!] Warning fetching issues: {e}")

    return events


def upsert_to_supabase(repo_id: str, events: list[dict[str, Any]]) -> int:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("[!] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Skipping DB upload.")
        return 0

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/raw_github_events"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    batch_size = 50
    inserted = 0
    for i in range(0, len(events), batch_size):
        batch = events[i : i + batch_size]
        payload = [
            {
                "repository_id": repo_id,
                "source": ev["source"],
                "external_id": ev["external_id"],
                "occurred_at": ev["occurred_at"],
                "payload": ev["payload"],
            }
            for ev in batch
        ]
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=60)
        if resp.ok:
            inserted += len(batch)
        else:
            print(f"[!] Error upserting batch: {resp.text}")

    return inserted


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch GitHub telemetry into Supabase / local cache.")
    parser.add_argument("owner", help="GitHub owner / organization")
    parser.add_argument("name", help="Repository name")
    parser.add_argument("--repo-id", default=None, help="Supabase repository UUID (optional)")
    parser.add_argument("--cache-only", action="store_true", help="Write JSON cache file without uploading to DB")
    parser.add_argument("--out", default=None, help="Custom output cache path")
    args = parser.parse_args()

    events = fetch_repository_events(args.owner, args.name)
    print(f"[✓] Retrieved {len(events)} events for {args.owner}/{args.name}")

    cache_file = args.out or f"cache_{args.owner}_{args.name}.json"
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2)
    print(f"[✓] Cached raw events to {cache_file}")

    if not args.cache_only and args.repo_id:
        print(f"[*] Uploading events to Supabase for repo {args.repo_id}...")
        uploaded = upsert_to_supabase(args.repo_id, events)
        print(f"[✓] Successfully uploaded {uploaded} events to Supabase.")


if __name__ == "__main__":
    main()
