# Ghost Maintainer

> **"Dependabot tells you after a bug is found. Ghost Maintainer warns you weeks before the package is compromised."**

An AI security agent that scores open-source **maintainer burnout and hijack risk (0–100)** from public GitHub activity. Powered by **Gemma 2** linguistic analysis and pure **SQL window functions** over commit and issue telemetry.

Proven against real supply chain incidents including the **xz-utils backdoor (CVE-2024-3094)**, **event-stream npm hijack**, and **ua-parser-js credential theft**.

---

## The Three Hackathon Tracks

| Track | Role in Ghost Maintainer | What Judges See |
|---|---|---|
| **Open Source AI & Gemma** | Gemma 2 evaluates maintainer exhaustion, coercion, sockpuppets, and takeover signs from comments and issue bodies. | Zero-egress, runs locally via Ollama / llama.cpp or inside Snowflake Cortex AI. Works 100% offline. |
| **GitHub Copilot** | Assisted development of statistical window functions, multi-source event fetchers, and Apple-spec responsive components. | Documented prompts and development velocity guide in [`docs/JUDGES_GUIDE.md`](./docs/JUDGES_GUIDE.md). |
| **Snowflake & SQL Data Layer** | Raw JSON loaded directly into `VARIANT` / `jsonb`. Moving averages, L1 distribution drift, and Z-score deviation computed in pure SQL. | Complete DDL, views, and analytics queries in [`sql/`](./sql/). |

---

## Risk Score Formula (PRD §6)

$$\text{Risk Score} = 0.5 \times \text{Linguistic Score} + 0.5 \times \text{Velocity Score}$$

- **Linguistic Score (0–100):** Average score across analyzed maintainer communications evaluated by Gemma 2.
- **Velocity Score (0–100):** Composite index across the 5 behavioral signals.
- **Risk Bands:** **Low** (0–33) · **Medium** (34–66) · **High** (67–100).

### The 5 Behavioral Signals (PRD §5):
1. **Activity Drop:** Weekly commits & reviews vs. 90-day moving average.
2. **Commit Time Shift:** Hour-of-day distribution drift ($L_1$ distance between baseline and recent 30 days).
3. **New-Author Surge:** Commits by authors first seen in the last 30 days, weighted by volume.
4. **Unreviewed Merges:** Pull requests merged without review comments or peer approvals.
5. **Reply Latency Spike:** Issue time-to-first-reply with moving average and Z-score deviation.

---

## Quick Start

### 1. Run the Local CLI Scanner (Instant Demo)
Zero setup required! Audit pre-computed incident telemetry or scan your own dependencies:

```bash
# Instant side-by-side demo: xz-utils (86 High Risk) vs pallets/flask (13 Low Risk)
npm run scan

# Audit dependencies in package.json
npm run scan:deps
```

*Or via Python:*
```bash
python cli/scan.py demo
python cli/scan.py scan <owner>/<repo>
```

---

### 2. Run the Next.js Web App

Designed according to Apple's design system ([`DESIGN-apple.md`](./DESIGN-apple.md)):

```bash
cd web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore:
- **Interactive Incident Study:** Side-by-side comparison between `xz-utils` and `flask`.
- **Dependency Scanner:** In-browser risk triage for `package.json` dependencies.
- **SQL Signals Showcase:** Interactive breakdown of all 5 SQL window functions.
- **Interactive Dashboard:** Risk gauges, score trend over time, and Gemma explanation panels.

---

### 3. Connect Supabase (Optional for Custom Repo Tracking)

1. Create a project on [Supabase](https://supabase.com).
2. Run migrations in order via the Supabase SQL Editor:
   - `supabase/migrations/20260307180000_init.sql`
   - `supabase/migrations/20260307200000_flatten_view.sql`
   - `supabase/migrations/20260307210000_behavior_views.sql`
3. Copy environment configuration:
   ```bash
   cp web/.env.example web/.env.local
   ```
4. Set keys in `web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GITHUB_TOKEN=ghp_...
   OLLAMA_HOST=http://127.0.0.1:11434
   GEMMA_MODEL=gemma2:9b
   ```

---

## Project Structure

```
Ghost-Maintainer/
├── cli/
│   ├── scan.py              # Local Gemma + Ollama CLI scanner (Python)
│   └── scan.mjs             # Zero-dependency local scanner (Node.js)
├── docs/
│   ├── ARCHITECTURE.md      # System diagram, risk formulas & data flow
│   ├── DEMO_SCRIPT.md       # 3-minute hackathon pitch script
│   └── JUDGES_GUIDE.md      # Mapping of track criteria to code proofs
├── fetcher/
│   ├── fetch_github.py      # Paginated GitHub ingest (commits, PRs, issues, comments)
│   ├── load_snowflake.py    # Snowflake raw JSON VARIANT loader
│   └── requirements.txt
├── sql/
│   ├── 01_tables.sql        # Storage layer DDL (Snowflake & Postgres)
│   ├── 02_flatten_views.sql # Normalization views for raw JSON
│   ├── 03_cortex_scoring.sql# Gemma scoring via Snowflake Cortex AI
│   ├── 04_behavior_signals.sql # Pure SQL window functions (PRD §5)
│   └── 05_risk_score.sql    # Combined risk calculation view
├── supabase/
│   └── migrations/          # Version-controlled Supabase migrations
├── web/
│   ├── src/app/             # Next.js 16 App Router (Landing, Dashboard, Detail)
│   ├── src/components/      # Apple design system UI components
│   └── src/lib/             # Gemma evaluation, behavior algorithms & Supabase clients
└── DESIGN-apple.md          # 563-line Apple design system specification
```

---

## Documentation Links

- **[Architecture & Math Specifications](docs/ARCHITECTURE.md)**
- **[3-Minute Demo Script](docs/DEMO_SCRIPT.md)**
- **[Judge-Friendly Track Guide](docs/JUDGES_GUIDE.md)**
- **[Apple Design System Analysis](DESIGN-apple.md)**
- **[Session Memory & Milestones](memory.md)**

---

## License

MIT

