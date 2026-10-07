"""
Batch GitHub → Supabase ingest (PRD fetcher/).
Secrets: GITHUB_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in fetcher/.env only.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not all([GITHUB_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY]):
    sys.exit("Missing GITHUB_TOKEN, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY in fetcher/.env")


def github_get(path: str) -> list | dict:
    r = requests.get(
        f"https://api.github.com{path}",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def main() -> None:
    if len(sys.argv) != 4:
        print("Usage: python fetch_github.py <repository_id> <owner> <name>")
        sys.exit(1)

    _repo_id, owner, name = sys.argv[1], sys.argv[2], sys.argv[3]
    issues = github_get(f"/repos/{owner}/{name}/issues?state=all&per_page=10")
    print(f"Fetched {len(issues)} issues for {owner}/{name} at {datetime.now(timezone.utc).isoformat()}")
    # TODO: upsert into raw_github_events via Supabase REST or supabase-py


if __name__ == "__main__":
    main()
