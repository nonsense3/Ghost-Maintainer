"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlobalNav } from "@/components/global-nav";
import {
  Terminal,
  Copy,
  Check,
  Cpu,
  Shield,
  Zap,
  Box,
  FileCode,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Server,
  Code2,
  Play,
  CheckCircle2,
  Layers,
  Activity,
  ChevronRight,
  Flame,
} from "lucide-react";

function CodeBlock({
  code,
  language = "bash",
  title = "Terminal",
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl bg-zinc-950/90 border border-zinc-800/90 overflow-hidden my-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-zinc-700/80">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          <span className="ml-2 text-zinc-400 font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-sans font-medium border border-zinc-700/50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-5 text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed selection:bg-indigo-500/40">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CliDocsPage() {
  const [activeTab, setActiveTab] = useState<"node" | "python">("node");
  const [terminalDemo, setTerminalDemo] = useState<"xz" | "flask" | "deps">("xz");

  return (
    <div className="min-h-screen text-zinc-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Global Navigation Bar */}
      <GlobalNav />

      <main className="max-w-[1280px] mx-auto px-6 md:px-12 pt-32 pb-24">
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-6 flex flex-col items-start animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-6 text-xs font-semibold text-indigo-400 tracking-wide uppercase shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Terminal className="w-3.5 h-3.5" />
              CLI & Terminal Scanner Documentation
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 mb-6 leading-tight">
              Ghost Maintainer <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-red-400">
                CLI Command Suite
              </span>
            </h1>

            <p className="text-base md:text-lg text-zinc-300 leading-relaxed font-light mb-8 max-w-xl">
              Audit maintainer burnout, account hijacking, and supply chain fragility directly in your terminal or CI/CD pipeline using Node.js or Python with local Gemma LLM scoring.
            </p>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2 border-t border-zinc-800/80">
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-center">
                <div className="text-xs text-zinc-400 uppercase font-mono mb-1">Runtimes</div>
                <div className="text-sm font-semibold text-zinc-100">Node / Python</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-center">
                <div className="text-xs text-zinc-400 uppercase font-mono mb-1">Dependencies</div>
                <div className="text-sm font-semibold text-emerald-400">Zero Required</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-center">
                <div className="text-xs text-zinc-400 uppercase font-mono mb-1">Local AI</div>
                <div className="text-sm font-semibold text-indigo-400">Gemma 4B / 9B</div>
              </div>
            </div>
          </div>

          {/* SIMULATED TERMINAL WINDOW SHOWCASE */}
          <div className="lg:col-span-6 w-full">
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl">
              {/* Window Controls & Tabs */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/90">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-xs font-mono text-zinc-400">ghost-maintainer-cli</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/80 text-xs font-mono">
                  <button
                    onClick={() => setTerminalDemo("xz")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      terminalDemo === "xz" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    xz-utils
                  </button>
                  <button
                    onClick={() => setTerminalDemo("flask")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      terminalDemo === "flask" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    flask
                  </button>
                  <button
                    onClick={() => setTerminalDemo("deps")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      terminalDemo === "deps" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    scan-deps
                  </button>
                </div>
              </div>

              {/* Live Simulated Output Content */}
              <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-zinc-300 max-h-[380px]">
                {terminalDemo === "xz" && (
                  <div>
                    <div className="text-cyan-400 mb-2">$ node cli/scan.mjs scan xz/xz-utils</div>
                    <div className="text-blue-400">
                      {"   _____ _               _     __  __       _       _"} <br />
                      {"  / ____| |             | |   |  \\/  |     (_)     | |"} <br />
                      {" | |  __| |__   ___  ___| |_  | \\  / | __ _ _ _ __ | |_"} <br />
                      {" | | |_ | '_ \\ / _ \\/ __| __| | |\\/| |/ _` | | '_ \\| __|"} <br />
                      {"  \\_____|_| |_|\\___/|___/\\__| |_|  |_|\\__,_|_|_| |_|\\__|"}
                    </div>
                    <div className="text-zinc-500 my-2">Predicting open-source supply chain failure before the CVE is published.</div>
                    <div className="text-zinc-400 font-bold border-t border-zinc-800 pt-2">
                      GHOST MAINTAINER AUDIT: <span className="text-white">xz/xz-utils (2024 Incident)</span>
                    </div>
                    <div className="text-red-400 font-bold my-1">
                      HIJACK / BURNOUT RISK SCORE : 86/100 (HIGH RISK)
                    </div>
                    <div className="text-zinc-500">Formula: 0.5 * Linguistic (89) + 0.5 * Velocity (82)</div>
                    <div className="my-2 border-t border-zinc-800/60 pt-2 text-zinc-400">BEHAVIORAL SIGNALS:</div>
                    <div className="text-zinc-300">   • Activity Drop            [<span className="text-red-400">███████████████░░░░░</span>]  78/100</div>
                    <div className="text-zinc-300">   • Commit Time Shift        [<span className="text-red-400">████████████████░░░░</span>]  84/100</div>
                    <div className="text-zinc-300">   • New Author Surge         [<span className="text-red-400">██████████████████░░</span>]  92/100</div>
                    <div className="text-zinc-300">   • Unreviewed Merges        [<span className="text-red-400">█████████████████░░░</span>]  85/100</div>
                    <div className="text-red-400 mt-2 font-semibold">GEMMA LINGUISTIC FLAGS (3 items):</div>
                    <div className="text-zinc-400">   [1] Score 88/100 (exhaustion, relinquishing_control)</div>
                    <div className="text-zinc-400 italic">       "Lasse Collin: I haven't lost interest, but my ability to care is limited."</div>
                  </div>
                )}

                {terminalDemo === "flask" && (
                  <div>
                    <div className="text-cyan-400 mb-2">$ node cli/scan.mjs scan pallets/flask</div>
                    <div className="text-zinc-400 font-bold border-t border-zinc-800 pt-2">
                      GHOST MAINTAINER AUDIT: <span className="text-white">pallets/flask</span>
                    </div>
                    <div className="text-emerald-400 font-bold my-1">
                      HIJACK / BURNOUT RISK SCORE : 12/100 (LOW RISK)
                    </div>
                    <div className="text-zinc-500">Formula: 0.5 * Linguistic (12) + 0.5 * Velocity (11)</div>
                    <div className="my-2 border-t border-zinc-800/60 pt-2 text-zinc-400">BEHAVIORAL SIGNALS:</div>
                    <div className="text-zinc-300">   • Activity Drop            [<span className="text-emerald-400">██░░░░░░░░░░░░░░░░░░</span>]  10/100</div>
                    <div className="text-zinc-300">   • Commit Time Shift        [<span className="text-emerald-400">██░░░░░░░░░░░░░░░░░░</span>]  12/100</div>
                    <div className="text-zinc-300">   • New Author Surge         [<span className="text-emerald-400">███░░░░░░░░░░░░░░░░░</span>]  15/100</div>
                    <div className="text-zinc-300">   • Unreviewed Merges        [<span className="text-emerald-400">█░░░░░░░░░░░░░░░░░░░</span>]   5/100</div>
                    <div className="text-emerald-400 mt-2 font-semibold">GEMMA LINGUISTIC FLAGS:</div>
                    <div className="text-zinc-400">   ✓ No elevated linguistic burnout or hijack indicators detected.</div>
                  </div>
                )}

                {terminalDemo === "deps" && (
                  <div>
                    <div className="text-cyan-400 mb-2">$ node cli/scan.mjs scan-deps --file package.json</div>
                    <div className="text-zinc-400">[*] Found 6 dependencies in package.json. Auditing risk triage...</div>
                    <div className="my-2 text-zinc-500">Package                     Risk Score   Band       Triage Status</div>
                    <div className="text-zinc-600">-------------------------------------------------------------------------</div>
                    <div className="text-zinc-300">event-stream                 <span className="text-red-400">92/100</span>     <span className="text-red-400">HIGH      </span> Known hijack incident (flatmap takeover)</div>
                    <div className="text-zinc-300">xz                           <span className="text-red-400">86/100</span>     <span className="text-red-400">HIGH      </span> Maintainer exhaustion / Jia Tan backdoor</div>
                    <div className="text-zinc-300">left-pad                     <span className="text-orange-400">65/100</span>     <span className="text-orange-400">MEDIUM    </span> Solo maintainer unpublish risk</div>
                    <div className="text-zinc-300">react                        <span className="text-emerald-400"> 8/100</span>     <span className="text-emerald-400">LOW       </span> Corporate sponsored / core team</div>
                    <div className="text-emerald-400 mt-2 font-semibold">[✓] Audit complete.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ENGINE SELECTOR TABS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 mb-14 backdrop-blur-xl">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("node")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all w-full sm:w-auto justify-center ${
                activeTab === "node"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
            >
              <Server className="w-4 h-4" />
              Node.js CLI (cli/scan.mjs)
            </button>
            <button
              onClick={() => setActiveTab("python")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all w-full sm:w-auto justify-center ${
                activeTab === "python"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
            >
              <Code2 className="w-4 h-4" />
              Python CLI (cli/scan.py)
            </button>
          </div>
          <div className="text-xs text-zinc-400 px-4 font-mono hidden md:block">
            Engine Mode: <span className="text-indigo-400 font-semibold">{activeTab === "node" ? "Standalone Zero-Dep" : "Python 3 + Ollama LLM"}</span>
          </div>
        </div>

        {/* STEP-BY-STEP GUIDELINE CARDS */}

        {/* STEP 01: PREREQUISITES */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
              STEP 01
            </span>
            <h2 className="text-2xl font-bold text-zinc-100">Prerequisites & System Requirements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 backdrop-blur-md hover:border-zinc-700/80 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100 mb-2">Runtime Environment</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                {activeTab === "node" ? "Requires Node.js 18.0 or higher. Works out of the box with zero npm installations." : "Requires Python 3.8 or higher. Uses native standard libraries."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 backdrop-blur-md hover:border-zinc-700/80 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100 mb-2">GitHub API Authentication</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                A standard <code className="text-zinc-200 font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">GITHUB_TOKEN</code> allows up to 5,000 requests/hour instead of 60 req/hr.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 backdrop-blur-md hover:border-zinc-700/80 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100 mb-2">Local Gemma LLM (Optional)</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                {activeTab === "node"
                  ? "Uses heuristic pattern extraction out of the box."
                  : "Connects to a local Ollama instance running gemma:4b or gemma2:9b."}
              </p>
            </div>
          </div>
        </section>

        {/* STEP 02: QUICK DEMO */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
              STEP 02
            </span>
            <h2 className="text-2xl font-bold text-zinc-100">Run the Zero-Config Simulation Demo</h2>
          </div>
          <p className="text-sm text-zinc-400 font-light mb-2">
            Verify your local setup instantly without needing API keys or network requests:
          </p>

          <CodeBlock
            code={activeTab === "node" ? "node cli/scan.mjs demo" : "python cli/scan.py demo"}
            language="bash"
            title={activeTab === "node" ? "node cli/scan.mjs" : "python cli/scan.py"}
          />
        </section>

        {/* STEP 03: REPO SCANNING */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
              STEP 03
            </span>
            <h2 className="text-2xl font-bold text-zinc-100">Audit Any Public GitHub Repository</h2>
          </div>
          <p className="text-sm text-zinc-400 font-light mb-2">
            Pass any public repository slug using <code className="text-zinc-200 font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">&lt;owner&gt;/&lt;repo&gt;</code>:
          </p>

          <CodeBlock
            code={
              activeTab === "node"
                ? `# Scan public repo using default token or environment variable
node cli/scan.mjs scan pallets/flask

# Scan using explicit GitHub access token switch
node cli/scan.mjs scan pallets/flask --token ghp_yourGitHubToken`
                : `# Scan public repo
python cli/scan.py scan pallets/flask

# Scan using explicit GitHub access token & local Ollama Gemma LLM
python cli/scan.py scan pallets/flask --token ghp_yourGitHubToken --ollama http://127.0.0.1:11434 --model gemma:4b`
            }
            language="bash"
            title="Repository Scanner Command"
          />
        </section>

        {/* STEP 04: DEPENDENCY AUDIT */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
              STEP 04
            </span>
            <h2 className="text-2xl font-bold text-zinc-100">Audit Project Dependency Manifests</h2>
          </div>
          <p className="text-sm text-zinc-400 font-light mb-2">
            Audit your local project's dependency manifest file to detect fragile single-maintainer links:
          </p>

          <CodeBlock
            code={
              activeTab === "node"
                ? `# Audit Node.js package.json
node cli/scan.mjs scan-deps --file package.json`
                : `# Audit Python requirements.txt
python cli/scan.py scan-deps --file requirements.txt`
            }
            language="bash"
            title="Dependency Auditor Command"
          />
        </section>

        {/* STEP 05: ENVIRONMENT VARIABLES */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
              STEP 05
            </span>
            <h2 className="text-2xl font-bold text-zinc-100">Automated Environment Setup</h2>
          </div>
          <p className="text-sm text-zinc-400 font-light mb-2">
            The CLI automatically reads environment variables from your local environment or <code className="text-zinc-200 font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">web/.env.local</code>:
          </p>

          <CodeBlock
            code={`# .env.local
GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere
OLLAMA_HOST=http://127.0.0.1:11434
GEMMA_MODEL=gemma:4b`}
            language="env"
            title="web/.env.local"
          />
        </section>

        {/* STEP 06: RISK SCORE BAND GUIDE */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
              STEP 06
            </span>
            <h2 className="text-2xl font-bold text-zinc-100">Interpreting Risk Score Classifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg mb-2">
                <CheckCircle2 className="w-5 h-5" />
                0 – 33: LOW RISK
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Healthy, active maintainer activity, distributed code review team, low response latency, and clean commit telemetry.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 backdrop-blur-md">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-lg mb-2">
                <AlertTriangle className="w-5 h-5" />
                34 – 66: MEDIUM RISK
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Single-maintainer bottleneck, rising issue response lag, timezone shifts, or minor author contribution anomalies.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 backdrop-blur-md">
              <div className="flex items-center gap-2 text-red-400 font-bold text-lg mb-2">
                <Flame className="w-5 h-5" />
                67 – 100: HIGH RISK
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Explicit maintainer burnout comments, hostile commit privilege pressuring, unreviewed binary merges, or account takeover signs.
              </p>
            </div>
          </div>

          {/* 5 Signals Showcase Card */}
          <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              The 5 Behavioral Signals Evaluated
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="font-semibold text-zinc-200 mb-1">1. Activity Drop</div>
                <div className="text-xs text-zinc-400">Measures sudden drop in commit frequency compared to 90-day baseline.</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="font-semibold text-zinc-200 mb-1">2. Commit Time Shift</div>
                <div className="text-xs text-zinc-400">Tracks variance and shift in maintainer active UTC hour distribution.</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="font-semibold text-zinc-200 mb-1">3. New Author Surge</div>
                <div className="text-xs text-zinc-400">Detects spike in commits merged from previously unknown accounts.</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="font-semibold text-zinc-200 mb-1">4. Unreviewed Merges</div>
                <div className="text-xs text-zinc-400">Ratios pull requests merged directly with 0 review comments or approvals.</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA TO WEB DASHBOARD */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-zinc-950 to-zinc-950 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Prefer an Interactive Web Interface?</h3>
            <p className="text-sm text-zinc-400 font-light">
              You can also run all audits directly in your browser using our full visual web dashboard with live charts and Snowflake SQL export.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm transition-all flex items-center gap-2 shrink-0 shadow-[0_0_25px_rgba(99,102,241,0.4)]"
          >
            Launch Web App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
