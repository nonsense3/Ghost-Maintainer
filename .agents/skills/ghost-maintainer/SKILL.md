---
name: ghost-maintainer
description: Audit open-source maintainer burnout, account takeover risk, and supply chain fragility using Ghost Maintainer CLI, API endpoints, or Snowflake SQL views. Use when assessing GitHub repository maintainer health, pre-CVE backdoor risks, or dependency manifests.
---

# Ghost Maintainer — AI Supply Chain Risk Assessment Skill

Ghost Maintainer is an AI-powered early warning system that predicts open-source supply chain failure (e.g. `xz-utils` backdoor CVE-2024-3094) before a CVE is published by analyzing maintainer burnout, hostile account takeover indicators, and behavioral commit velocity anomalies.

---

## 1. Quick CLI Execution

### Node.js CLI (Zero External Dependencies)
```bash
# Offline simulation demo
node cli/scan.mjs demo

# Audit a public repository (<owner>/<repo>)
node cli/scan.mjs scan pallets/flask

# Audit using explicit GitHub API access token
node cli/scan.mjs scan pallets/flask --token ghp_yourGitHubToken

# Audit project dependency manifest
node cli/scan.mjs scan-deps --file package.json
```

### Python CLI (Ollama + Gemma LLM Scoring)
```bash
# Offline simulation demo
python cli/scan.py demo

# Audit repository with local Gemma LLM scoring
python cli/scan.py scan pallets/flask --ollama http://127.0.0.1:11434 --model gemma:4b

# Audit Python dependencies
python cli/scan.py scan-deps --file requirements.txt
```

---

## 2. API Endpoints

### Ingest & Analyze Repository
- **Endpoint**: `POST /api/repos/ingest`
- **Body**: `{"url": "https://github.com/owner/repo"}`
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "owner/repo",
    "risk_score": 42,
    "linguistic_score": 35,
    "velocity_score": 49,
    "signals": {
      "activity_drop": 45,
      "commit_time_shift": 30,
      "new_author_surge": 60,
      "unreviewed_merges": 50,
      "reply_latency_spike": 40
    }
  }
  ```

---

## 3. SQL Data Layer (Snowflake & Postgres)

To execute in-warehouse risk scoring, query the 5 behavioral signals using pure SQL window functions:

```sql
SELECT 
    repo_name,
    activity_drop_score,
    commit_time_shift_score,
    new_author_surge_score,
    unreviewed_merges_score,
    reply_latency_spike_score,
    ROUND(0.5 * linguistic_score + 0.5 * velocity_score) AS combined_risk_score
FROM ghost_maintainer_risk_summary
WHERE combined_risk_score >= 67; -- High Risk Triage Filter
```

---

## 4. Risk Classification Bands

| Score | Risk Band | Action / Triage Guidance |
|---|---|---|
| **0 – 33** | **LOW** | Repositories with healthy maintainer velocity, active multi-contributor baseline, and automated code review pipeline. |
| **34 – 66** | **MEDIUM** | Single-maintainer bottlenecks, elevated response lag, or minor timezone contribution drift. |
| **67 – 100** | **HIGH** | Severe maintainer burnout comments, hostile commit privilege escalation attempts, or unreviewed binary commit surges. |
