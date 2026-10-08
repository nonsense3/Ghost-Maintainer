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
} from "lucide-react";

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl bg-zinc-950 border border-zinc-800/80 overflow-hidden my-4 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 text-xs text-zinc-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
          <span className="ml-2 text-zinc-500">{language}</span>
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-sans font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CliDocsPage() {
  const [activeTab, setActiveTab] = useState<"node" | "python">("node");

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Navigation Bar */}
      <GlobalNav />

      <main className="max-w-[1200px] mx-auto px-6 md:px-12 pt-32 pb-24">
        {/* Header Badge & Title */}
        <div className="flex flex-col items-start mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 text-xs font-semibold text-indigo-400 tracking-wide uppercase">
            <Terminal className="w-3.5 h-3.5" />
            CLI & Terminal Scanner Documentation
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 mb-6 leading-tight">
            Ghost Maintainer CLI Guide
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl leading-relaxed font-light">
            Step-by-step instructions for security researchers, auditors, and DevOps engineers to run local supply chain risk assessments on public GitHub repositories or dependency manifests.
          </p>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="flex items-center gap-3 p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 w-fit mb-12 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("node")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === "node"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Server className="w-4 h-4" />
            Node.js CLI (Zero-Dependency)
          </button>
          <button
            onClick={() => setActiveTab("python")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === "python"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Python CLI (Ollama + Gemma LLM)
          </button>
        </div>

        {/* Section 1: Prerequisites */}
        <section className="mb-16 border-b border-zinc-800/60 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-indigo-400 border border-zinc-700">
              1
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Prerequisites & System Requirements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Box className="w-4 h-4" />
                Runtime Environment
              </div>
              <p className="text-sm text-zinc-400">
                {activeTab === "node" ? "Node.js 18.0+" : "Python 3.8+"} installed on your operating system.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Shield className="w-4 h-4" />
                GitHub API Access
              </div>
              <p className="text-sm text-zinc-400">
                A standard <code className="text-zinc-200 font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">GITHUB_TOKEN</code> to bypass rate limits (60 req/hr vs 5,000 req/hr).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                <Cpu className="w-4 h-4" />
                Local LLM (Optional)
              </div>
              <p className="text-sm text-zinc-400">
                {activeTab === "node"
                  ? "Uses heuristic keyword matching out of the box."
                  : "Connects to Ollama running Gemma (e.g. gemma:4b or gemma2:9b)."}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Quick Start Demo */}
        <section className="mb-16 border-b border-zinc-800/60 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-indigo-400 border border-zinc-700">
              2
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Step 1: Run the Offline Simulation Demo</h2>
          </div>
          <p className="text-zinc-400 font-light mb-4">
            Test the CLI engine immediately without setup or API keys. This runs a side-by-side audit of <code className="text-zinc-200 font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">xz/xz-utils</code> (pre-backdoor CVE-2024-3094) vs a healthy baseline repo.
          </p>

          <CodeBlock
            code={activeTab === "node" ? "node cli/scan.mjs demo" : "python cli/scan.py demo"}
            language="bash"
          />
        </section>

        {/* Section 3: Scanning Repositories */}
        <section className="mb-16 border-b border-zinc-800/60 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-indigo-400 border border-zinc-700">
              3
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Step 2: Audit a Public GitHub Repository</h2>
          </div>
          <p className="text-zinc-400 font-light mb-4">
            Specify any public GitHub repository using the format <code className="text-zinc-200 font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">&lt;owner&gt;/&lt;repo&gt;</code>:
          </p>

          <CodeBlock
            code={
              activeTab === "node"
                ? `# Scan public repo using default token / env token
node cli/scan.mjs scan pallets/flask

# Scan using explicit GitHub access token
node cli/scan.mjs scan pallets/flask --token ghp_yourGitHubToken`
                : `# Scan public repo
python cli/scan.py scan pallets/flask

# Scan using explicit GitHub access token & local Ollama model
python cli/scan.py scan pallets/flask --token ghp_yourGitHubToken --ollama http://127.0.0.1:11434 --model gemma:4b`
            }
            language="bash"
          />
        </section>

        {/* Section 4: Dependency Tree Audit */}
        <section className="mb-16 border-b border-zinc-800/60 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-indigo-400 border border-zinc-700">
              4
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Step 3: Audit Project Dependency Manifests</h2>
          </div>
          <p className="text-zinc-400 font-light mb-4">
            Scan local dependency manifests to surface high-risk single-maintainer libraries in your stack:
          </p>

          <CodeBlock
            code={
              activeTab === "node"
                ? `# Audit Node.js dependencies
node cli/scan.mjs scan-deps --file package.json`
                : `# Audit Python dependencies
python cli/scan.py scan-deps --file requirements.txt`
            }
            language="bash"
          />
        </section>

        {/* Section 5: Environment Setup */}
        <section className="mb-16 border-b border-zinc-800/60 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-indigo-400 border border-zinc-700">
              5
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Step 4: Environment Variable Configuration</h2>
          </div>
          <p className="text-zinc-400 font-light mb-4">
            Create a <code className="text-zinc-200 font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">.env.local</code> file in your project or export shell environment variables:
          </p>

          <CodeBlock
            code={`# .env.local
GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere
OLLAMA_HOST=http://127.0.0.1:11434
GEMMA_MODEL=gemma:4b`}
            language="env"
          />
        </section>

        {/* Section 6: Interpreting Results */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-indigo-400 border border-zinc-700">
              6
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Understanding the Audit Report</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="text-emerald-400 font-bold text-lg mb-1">0 – 33: LOW RISK</div>
              <p className="text-xs text-zinc-400">
                Healthy maintainer activity, distributed contributions, automated CI/CD checks, and responsive issue handling.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="text-amber-400 font-bold text-lg mb-1">34 – 66: MEDIUM RISK</div>
              <p className="text-xs text-zinc-400">
                Single-maintainer bottleneck, rising issue reply latency, or minor author contribution shifts.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="text-red-400 font-bold text-lg mb-1">67 – 100: HIGH RISK</div>
              <p className="text-xs text-zinc-400">
                Severe maintainer burnout keywords, pushy takeover attempts by unknown accounts, or unreviewed binary commit surges.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              The 5 Behavioral Signals Analyzed
            </h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong className="text-zinc-200">Activity Drop:</strong> Sudden baseline drop in commit frequency over a 30-day window.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong className="text-zinc-200">Commit Time Shift:</strong> Significant shift in maintainer timezone / active hour distribution.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong className="text-zinc-200">New Author Surge:</strong> Sudden increase in commits merged from previously unverified authors.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong className="text-zinc-200">Unreviewed Merges:</strong> Pull requests merged directly without code review comments or approvals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span><strong className="text-zinc-200">Reply Latency Spike:</strong> Increased maintainer response lag on critical issues and PRs.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA to Web App */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-zinc-900 to-zinc-900 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Prefer a Visual Web Dashboard?</h3>
            <p className="text-sm text-zinc-400 font-light">
              You can also run all audits directly in your browser using our interactive web dashboard.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-500/25"
          >
            Launch Web App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
