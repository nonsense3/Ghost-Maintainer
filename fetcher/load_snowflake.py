"""
Snowflake Raw JSON Ingestion (PRD §8 fetcher/load_snowflake.py).
Loads cached or fetched GitHub event JSON into Snowflake VARIANT column.
Automatically reads credentials from fetcher/.env, web/.env.local, or environment.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Load environment files automatically
def load_env_file():
    paths_to_check = [
        Path(__file__).parent / ".env",
        Path(__file__).parent.parent / "web" / ".env.local",
        Path(__file__).parent.parent / "web" / ".env",
        Path(__file__).parent.parent / ".env",
    ]
    for p in paths_to_check:
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ and v:
                            os.environ[k] = v

load_env_file()

try:
    import snowflake.connector
except ImportError:
    snowflake = None


def load_events_to_snowflake(json_path: str, repo_id: str) -> None:
    if not os.path.exists(json_path):
        sys.exit(f"File not found: {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        events = json.load(f)

    print(f"[*] Loaded {len(events)} events from {json_path}")

    user = os.environ.get("SNOWFLAKE_USER")
    password = os.environ.get("SNOWFLAKE_PASSWORD")
    account = os.environ.get("SNOWFLAKE_ACCOUNT")
    warehouse = os.environ.get("SNOWFLAKE_WAREHOUSE", "COMPUTE_WH")
    database = os.environ.get("SNOWFLAKE_DATABASE", "GHOST_MAINTAINER")
    schema = os.environ.get("SNOWFLAKE_SCHEMA", "ANALYTICS")

    print(f"[*] Connecting to Snowflake account: {account} as user: {user}")

    if not all([user, password, account]):
        print("\n[i] Notice: SNOWFLAKE_PASSWORD is empty in your .env file.")
        print("    Add your password to fetcher/.env or web/.env.local to execute direct inserts.\n")
        print(f"    Alternatively, load {json_path} via Snowflake Worksheet (zero-driver):\n")
        print(f"    PUT file://{os.path.abspath(json_path)} @GHOST_MAINTAINER.ANALYTICS.%RAW_GITHUB_EVENTS;")
        print(f"    COPY INTO GHOST_MAINTAINER.ANALYTICS.RAW_GITHUB_EVENTS FROM @%RAW_GITHUB_EVENTS FILE_FORMAT=(TYPE='JSON');")
        return

    if not snowflake:
        sys.exit("Please install snowflake-connector-python: pip install snowflake-connector-python")

    ctx = snowflake.connector.connect(
        user=user,
        password=password,
        account=account,
        warehouse=warehouse,
        database=database,
        schema=schema,
    )
    cs = ctx.cursor()
    try:
        query = """
        INSERT INTO RAW_GITHUB_EVENTS (repository_id, source, external_id, occurred_at, payload)
        SELECT %s, %s, %s, %s, PARSE_JSON(%s)
        """
        for ev in events:
            cs.execute(query, (
                repo_id,
                ev["source"],
                ev["external_id"],
                ev["occurred_at"],
                json.dumps(ev["payload"]),
            ))
        print(f"[✓] Successfully inserted {len(events)} events into Snowflake {database}.{schema}.RAW_GITHUB_EVENTS.")
    finally:
        cs.close()
        ctx.close()


def main():
    parser = argparse.ArgumentParser(description="Load GitHub JSON into Snowflake VARIANT.")
    parser.add_argument("json_file", help="Path to cached JSON file")
    parser.add_argument("--repo-id", default="repo-demo-1", help="Repository identifier")
    args = parser.parse_args()
    load_events_to_snowflake(args.json_file, args.repo_id)


if __name__ == "__main__":
    main()
