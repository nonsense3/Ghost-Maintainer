import Link from "next/link";
import { DemoComparison } from "@/components/demo-comparison";
import { DependencyScannerCard } from "@/components/dependency-scanner-card";
import { GlobalNav } from "@/components/global-nav";
import { SqlSignalsShowcase } from "@/components/sql-signals-showcase";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas-parchment">
      {/* 1. Global Navigation Bar */}
      <GlobalNav
        right={
          <Link href="/dashboard" className="btn-dark-utility">
            Launch App
          </Link>
        }
      />

      {/* 2. Hero Section (Light Canvas) */}
      <section className="product-tile-light text-center flex flex-col items-center justify-center gap-6 py-20 px-6 border-b border-hairline">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-parchment border border-hairline text-caption text-ink-muted-80 mb-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>The Human Security Layer for Open-Source Software</span>
        </div>

        <h1 className="text-hero text-ink max-w-4xl tracking-tight font-semibold">
          See maintainer risk before the CVE.
        </h1>

        <p className="text-lead text-ink-muted-80 max-w-2xl text-[20px] sm:text-[24px] leading-relaxed">
          Dependabot reacts after the vulnerability exists. Ghost Maintainer
          monitors burnout, tone shift, and social engineering takeover signals
          in public GitHub activity weeks before a library is compromised.
        </p>

        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <a href="#demo" className="btn-primary">
            Explore Incident Demo
          </a>
          <Link href="/dashboard" className="btn-secondary-pill">
            Go to Dashboard
          </Link>
          <a
            href="https://github.com/nonsense3/Ghost-Maintainer"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark-utility text-[15px]"
          >
            GitHub Repo ↗
          </a>
        </div>

        {/* Feature summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-12 text-left">
          <div className="store-utility-card bg-canvas-parchment/60 p-6 rounded-2xl border border-hairline">
            <span className="text-caption font-semibold text-primary block mb-1">
              01 · Linguistic Analysis
            </span>
            <h4 className="text-body-strong text-ink mb-2">Gemma 2 LLM</h4>
            <p className="text-caption text-ink-muted-80 leading-relaxed">
              Open-weight Gemma reads maintainer communications locally via
              Ollama or Cortex, spotting exhaustion, coercion, and sudden style
              divergence.
            </p>
          </div>

          <div className="store-utility-card bg-canvas-parchment/60 p-6 rounded-2xl border border-hairline">
            <span className="text-caption font-semibold text-primary block mb-1">
              02 · Behavioral SQL
            </span>
            <h4 className="text-body-strong text-ink mb-2">Window Functions</h4>
            <p className="text-caption text-ink-muted-80 leading-relaxed">
              Detects commit time drift (e.g. 9-5 UTC switching to 3 AM UTC),
              new-author surges, unreviewed merges, and issue reply latency
              spikes in pure SQL.
            </p>
          </div>

          <div className="store-utility-card bg-canvas-parchment/60 p-6 rounded-2xl border border-hairline">
            <span className="text-caption font-semibold text-primary block mb-1">
              03 · Combined Risk Index
            </span>
            <h4 className="text-body-strong text-ink mb-2">0–100 Risk Score</h4>
            <p className="text-caption text-ink-muted-80 leading-relaxed">
              Combines 50% linguistic tone + 50% activity velocity into an
              actionable early-warning index with categorized red flags and full
              audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Demo Comparison Section (Parchment Tile) */}
      <section id="demo" className="py-20 px-6 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-caption font-mono uppercase text-primary tracking-wider block mb-2">
            Interactive Incident Study
          </span>
          <h2 className="text-display-lg text-ink font-semibold">
            Healthy Team vs. Hijacked Package
          </h2>
          <p className="text-body text-ink-muted-80 mt-2">
            See how Ghost Maintainer detects real-world supply chain attacks like
            xz-utils (CVE-2024-3094) before malicious code was even merged.
          </p>
        </div>

        <DemoComparison />
      </section>

      {/* 4. Dependency Scanner Simulator (Light Tile) */}
      <section
        id="scanner"
        className="product-tile-light border-y border-hairline py-20 px-6"
      >
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-caption font-mono uppercase text-primary tracking-wider block mb-2">
              Package Risk Triage
            </span>
            <h2 className="text-display-lg text-ink font-semibold">
              Scan Whole Dependency Trees
            </h2>
            <p className="text-body text-ink-muted-80 mt-2">
              Audit dependencies from <code className="font-mono">package.json</code> or{" "}
              <code className="font-mono">requirements.txt</code> to rank libraries
              by maintainer burnout and single-maintainer fragility.
            </p>
          </div>

          <DependencyScannerCard />
        </div>
      </section>

      {/* 5. SQL Engine Showcase (Dark Tile) */}
      <section
        id="sql"
        className="product-tile-dark bg-surface-tile-1 border-b border-ink-muted-80/40 py-20 px-6"
      >
        <div className="max-w-[1440px] mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-caption font-mono uppercase text-primary-on-dark tracking-wider block mb-2">
              Zero-Egress Data Layer
            </span>
            <h2 className="text-display-lg text-white font-semibold">
              The 5 Behavioral Signals in Pure SQL
            </h2>
            <p className="text-body text-body-muted mt-2">
              Statistical window functions, L1 distribution drift, and Z-score
              deviation run directly in Postgres or Snowflake without exporting
              code or credentials.
            </p>
          </div>

          <SqlSignalsShowcase />
        </div>
      </section>

      {/* 6. Architecture & Tracks Section */}
      <section id="architecture" className="py-20 px-6 max-w-[1440px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-caption font-mono uppercase text-primary tracking-wider block mb-2">
            Three Specialized Tracks
          </span>
          <h2 className="text-display-lg text-ink font-semibold">
            Engineered for Transparency & Performance
          </h2>
          <p className="text-body text-ink-muted-80 mt-2">
            Ghost Maintainer brings together open-weight AI, copilot-assisted
            engineering, and scalable database analytics.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="store-utility-card bg-canvas p-8 rounded-2xl border border-hairline flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold text-lg mb-4">
                G
              </div>
              <h3 className="text-display-md text-ink text-2xl font-semibold mb-2">
                Open Source AI & Gemma
              </h3>
              <p className="text-caption text-ink-muted-80 leading-relaxed mb-4">
                Runs locally via Ollama / llama.cpp on developer laptops or inside
                Snowflake Cortex AI. Completely private, offline-capable, and
                custom-prompted for maintainer tone dynamics.
              </p>
            </div>
            <code className="text-xs font-mono text-ink-muted-48 bg-canvas-parchment p-2 rounded block">
              ollama run gemma2:9b
            </code>
          </div>

          <div className="store-utility-card bg-canvas p-8 rounded-2xl border border-hairline flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
                C
              </div>
              <h3 className="text-display-md text-ink text-2xl font-semibold mb-2">
                GitHub Copilot Track
              </h3>
              <p className="text-caption text-ink-muted-80 leading-relaxed mb-4">
                Accelerated end-to-end development of the multi-source ingest
                pipeline, SQL moving window functions, and responsive Apple-style
                interactive visualization components.
              </p>
            </div>
            <code className="text-xs font-mono text-ink-muted-48 bg-canvas-parchment p-2 rounded block">
              docs/JUDGES_GUIDE.md
            </code>
          </div>

          <div className="store-utility-card bg-canvas p-8 rounded-2xl border border-hairline flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg mb-4">
                S
              </div>
              <h3 className="text-display-md text-ink text-2xl font-semibold mb-2">
                Snowflake & Supabase
              </h3>
              <p className="text-caption text-ink-muted-80 leading-relaxed mb-4">
                Raw JSON stored directly in VARIANT/jsonb columns. In-database
                transformations calculate rolling averages and distribution
                drift with zero data egress.
              </p>
            </div>
            <code className="text-xs font-mono text-ink-muted-48 bg-canvas-parchment p-2 rounded block">
              sql/04_behavior_signals.sql
            </code>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-canvas-parchment border-t border-hairline py-12 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-caption text-ink-muted-48">
          <div>
            <p className="font-semibold text-ink">Ghost Maintainer</p>
            <p className="mt-1">
              Predicting open-source supply chain failure before the CVE is published.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-ink-muted-80">
            <a href="#demo" className="hover:text-primary transition-colors">
              Live Demo
            </a>
            <a href="#scanner" className="hover:text-primary transition-colors">
              Dependency Scanner
            </a>
            <a href="#sql" className="hover:text-primary transition-colors">
              SQL Engine
            </a>
            <a
              href="https://github.com/nonsense3/Ghost-Maintainer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
