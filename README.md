# Ghost Maintainer

> Predict open-source supply chain compromises before they happen — by monitoring the humans behind the code.

Ghost Maintainer is an AI-powered security intelligence tool that detects maintainer burnout, social engineering, and account takeover risk in open-source projects. It combines **Gemma 4B** linguistic analysis of maintainer communications with **statistical behavioral signals** computed via pure SQL window functions to produce a unified risk score (0–100) for any GitHub repository.

Unlike dependency scanners that react after a vulnerability is disclosed, Ghost Maintainer surfaces early warning indicators weeks before a compromise occurs — validated against real-world incidents including the [xz-utils backdoor (CVE-2024-3094)](https://nvd.nist.gov/vuln/detail/CVE-2024-3094), the [event-stream npm hijack](https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident), and the [ua-parser-js credential theft](https://github.com/nicolo-ribaudo/tc39-proposal-structs/issues/1).

---

## Features

- **Risk Scoring Engine** — Dual-analysis pipeline combining LLM linguistic evaluation with quantitative behavioral metrics into a single 0–100 risk index.
- **5 Behavioral Signals** — Activity drop detection, commit time-shift analysis (L₁ distribution drift), new-author surge tracking, unreviewed merge monitoring, and reply latency spike detection — all computed in pure SQL.
- **Gemma 4B Integration** — Runs fully offline via Ollama or llama.cpp. Evaluates maintainer exhaustion, coercion patterns, sockpuppet indicators, and takeover language from issue comments and PR discussions.
- **Interactive Web Dashboard** — Next.js 16 application with risk gauges, trend charts, behavioral signal meters, and Gemma explanation panels.
- **CLI Scanner** — Available in both Python and Node.js. Scan individual repositories or audit all dependencies in a `package.json` with a single command.
- **Dependency Triage** — In-browser and CLI-based `package.json` scanner that batch-evaluates your dependency tree for supply chain risk.
- **Incident Case Studies** — Pre-computed telemetry for known supply chain attacks, enabling instant side-by-side comparison without any configuration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Ingestion Layer                       │
│         GitHub REST API → Python Fetcher / Next.js Worker       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Raw JSON
┌──────────────────────────────▼──────────────────────────────────┐
│                    Storage & Database Layer                      │
│           PostgreSQL (Supabase) / Snowflake VARIANT             │
│                   ↓ Flattening Views ↓                          │
└────────────┬─────────────────────────────────┬──────────────────┘
             │                                 │
┌────────────▼────────────┐   ┌────────────────▼─────────────────┐
│   Linguistic Analysis   │   │     Behavioral Signal Engine     │
│  Gemma 4B (Ollama /     │   │  Pure SQL Window Functions       │
│  Snowflake Cortex AI)   │   │  Moving Averages, L₁ Drift,     │
│  Score: 0–100           │   │  Z-Scores — Score: 0–100        │
└────────────┬────────────┘   └────────────────┬─────────────────┘
             │                                 │
┌────────────▼─────────────────────────────────▼──────────────────┐
│                     Combined Risk Index                          │
│        Risk = 0.5 × Linguistic + 0.5 × Velocity                 │
│        Low (0–33) · Medium (34–66) · High (67–100)              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                        User Interfaces                          │
│    Web Dashboard  ·  CLI Scanner  ·  Dependency Triage          │
└─────────────────────────────────────────────────────────────────┘
```

For the full architecture specification, data flow diagrams, and mathematical definitions, see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Risk Score

The combined risk score is a weighted average of two independent assessments:

```
Risk Score = 0.5 × Linguistic Score + 0.5 × Velocity Score
```

| Component | Source | Method |
|---|---|---|
| **Linguistic Score** (0–100) | Issue comments, PR discussions, maintainer messages | Gemma 4B evaluates exhaustion, coercion, sockpuppet indicators |
| **Velocity Score** (0–100) | Commit metadata, PR reviews, issue timestamps | 5 behavioral signals computed via SQL window functions |

### Behavioral Signals

| Signal | What it Detects |
|---|---|
| **Activity Drop** | Weekly commits and reviews falling below the 90-day moving average |
| **Commit Time Shift** | Hour-of-day distribution drift (L₁ distance between baseline and recent 30 days) |
| **New-Author Surge** | Disproportionate commits from authors first seen in the last 30 days |
| **Unreviewed Merges** | Pull requests merged without review comments or peer approvals |
| **Reply Latency Spike** | Issue time-to-first-reply deviating significantly from baseline (Z-score) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10 *(optional, for the Python CLI and data fetcher)*
- **Ollama** *(optional, for local Gemma inference)*

### Installation

```bash
git clone https://github.com/nonsense3/Ghost-Maintainer.git
cd Ghost-Maintainer
npm install
```

For the web application:

```bash
cd web
npm install
```

For the Python data fetcher:

```bash
cd fetcher
pip install -r requirements.txt
```

---

## Usage

### CLI Scanner

Run pre-computed incident demonstrations or scan live repositories directly from the terminal.

```bash
# Side-by-side demo: xz-utils (High Risk) vs flask (Low Risk)
npm run scan

# Scan a specific repository
npm run scan:repo -- <owner>/<repo>

# Audit all dependencies in a package.json
npm run scan:deps
```

The Python CLI provides equivalent functionality:

```bash
python cli/scan.py demo
python cli/scan.py scan <owner>/<repo>
```

### Web Dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard includes:

- **Incident Study** — Interactive comparison of real supply chain incidents with behavioral signal breakdowns.
- **Dependency Scanner** — Upload or paste a `package.json` to triage your dependency tree.
- **SQL Signals Showcase** — Interactive breakdown of all 5 behavioral signal computations.
- **Repository Detail** — Risk gauge, score trend over time, behavioral meters, and Gemma explanation panels.

### Supabase Setup (Optional)

Required only for persistent custom repository tracking with authentication.

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations in the SQL Editor in order:
   - `supabase/migrations/20260307180000_init.sql`
   - `supabase/migrations/20260307200000_flatten_view.sql`
   - `supabase/migrations/20260307210000_behavior_views.sql`
3. Configure environment variables:
   ```bash
   cp web/.env.example web/.env.local
   ```
4. Populate `web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   GITHUB_TOKEN=ghp_...
   OLLAMA_HOST=http://127.0.0.1:11434
   GEMMA_MODEL=gemma:4b
   ```

### Ollama / Gemma Setup (Optional)

For local, fully offline linguistic analysis:

```bash
ollama pull gemma:4b
ollama serve
```

Ghost Maintainer will automatically connect to the local Ollama instance at `http://127.0.0.1:11434`.

---

## Project Structure

```
Ghost-Maintainer/
├── cli/
│   ├── scan.py                 # Python CLI — Gemma + Ollama scanner
│   └── scan.mjs                # Node.js CLI — zero-dependency scanner
├── docs/
│   ├── ARCHITECTURE.md         # System architecture & math specifications
│   ├── DEMO_SCRIPT.md          # Presentation script
│   └── JUDGES_GUIDE.md         # Track criteria mapping
├── fetcher/
│   ├── fetch_github.py         # Paginated GitHub data ingestion
│   ├── load_snowflake.py       # Snowflake VARIANT loader
│   └── requirements.txt        # Python dependencies
├── sql/
│   ├── 01_tables.sql           # DDL for Snowflake & PostgreSQL
│   ├── 02_flatten_views.sql    # JSON normalization views
│   ├── 03_cortex_scoring.sql   # Snowflake Cortex AI Gemma scoring
│   ├── 04_behavior_signals.sql # Window functions for 5 behavioral signals
│   └── 05_risk_score.sql       # Combined risk calculation view
├── supabase/
│   └── migrations/             # Version-controlled database migrations
├── web/
│   ├── src/app/                # Next.js 16 App Router pages
│   ├── src/components/         # UI components
│   └── src/lib/                # Gemma evaluation, analytics & database clients
├── DESIGN-apple.md             # Design system specification
└── package.json                # Root project scripts
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Lucide Icons |
| **Database** | PostgreSQL (Supabase) with RLS, Snowflake |
| **AI / LLM** | Gemma 4B via Ollama, Snowflake Cortex AI |
| **Data Ingestion** | Python (requests, supabase-py), GitHub REST API |
| **Validation** | Zod 4, TypeScript 5 |
| **Rate Limiting** | Upstash Redis + Ratelimit |

---

## Documentation

| Document | Description |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System diagram, risk formulas, data flow, and behavioral signal mathematics |
| [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) | Structured presentation walkthrough |
| [`docs/JUDGES_GUIDE.md`](./docs/JUDGES_GUIDE.md) | Track-by-track criteria with code references |
| [`DESIGN-apple.md`](./DESIGN-apple.md) | Design system specification |
| [`sql/README.md`](./sql/README.md) | SQL layer documentation |

---

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

---

## License

This project is licensed under the MIT License. See [`LICENSE`](./LICENSE) for details.
