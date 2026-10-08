import Link from "next/link";
import Image from "next/image";
import { DemoComparison } from "@/components/demo-comparison";
import { DependencyScannerCard } from "@/components/dependency-scanner-card";
import { GlobalNav } from "@/components/global-nav";
import { SqlSignalsShowcase } from "@/components/sql-signals-showcase";
import { ArrowRight, Terminal, Shield, Activity, Search, Server, Cloud, Database, Lock, Code2 } from "lucide-react";

export default function HomePage() {
  const scrollItems = [
    { name: "Node.js", icon: Server },
    { name: "Python", icon: Terminal },
    { name: "Docker", icon: Cloud },
    { name: "PostgreSQL", icon: Database },
    { name: "React", icon: Code2 },
    { name: "Auth0", icon: Lock },
    { name: "GitHub", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* Grid Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* 1. Global Navigation Bar */}
      <GlobalNav
        right={
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 font-semibold hover:bg-white transition-colors text-sm">
            Launch App
          </Link>
        }
      />

      {/* Removed mb-32 and huge paddings. Using flex-col and minimal gaps for seamless flow */}
      <main className="w-full flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center px-6 pt-32 pb-16 w-full animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 mb-8 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">Ghost Engine v1.0</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-6 max-w-4xl leading-tight">
            Stop supply chain attacks <br className="hidden md:block" /> before they <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">start.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed font-light">
            Prevent the next xz-utils hack. Ghost Maintainer audits human behavior, detecting compromised accounts and burned-out maintainers before malicious code is ever merged.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-zinc-100 text-zinc-900 font-semibold hover:bg-white transition-colors flex items-center gap-2 w-full sm:w-auto justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              Start Analysis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/nonsense3/Ghost-Maintainer"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-medium hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-2 w-full sm:w-auto justify-center backdrop-blur-sm"
            >
              <Terminal className="w-4 h-4" />
              Documentation
            </a>
          </div>
        </section>

        {/* Live Sequential Scroller */}
        <section className="w-full relative flex flex-col items-center py-8 bg-[#0c0c0c]/50 border-y border-zinc-900/50">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-6 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Monitors across your entire stack
          </p>
          <div className="w-full relative overflow-hidden flex py-2" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            <div className="flex flex-nowrap w-max min-w-full animate-scrolling hover:[animation-play-state:paused]">
              {/* Duplicate list to create seamless infinite loop */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-nowrap shrink-0 gap-16 px-8 items-center justify-around w-max">
                  {scrollItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={`${i}-${idx}`} className="flex items-center gap-3 text-zinc-500 hover:text-indigo-400 transition-all duration-300 grayscale hover:grayscale-0 opacity-50 hover:opacity-100 cursor-pointer hover:scale-110">
                        <Icon className="w-10 h-10 md:w-12 md:h-12" strokeWidth={1.5} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="w-full px-6 md:px-12 py-16 bg-[#0A0A0A]">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-0 rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-900/30 divide-y md:divide-y-0 md:divide-x divide-zinc-800/60 shadow-2xl">
            <div className="p-8 md:p-12 flex flex-col gap-4 transition-colors hover:bg-zinc-800/20 group">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                 <Shield className="w-6 h-6 text-indigo-400" />
               </div>
               <h3 className="text-xl font-semibold text-zinc-100 mt-2">Linguistic Analysis</h3>
               <p className="text-zinc-400 font-light leading-relaxed">Reads maintainer comms locally spotting exhaustion, coercion, and sudden style divergence using Gemma 2 LLM.</p>
            </div>
            <div className="p-8 md:p-12 flex flex-col gap-4 transition-colors hover:bg-zinc-800/20 group">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                 <Activity className="w-6 h-6 text-indigo-400" />
               </div>
               <h3 className="text-xl font-semibold text-zinc-100 mt-2">Behavioral SQL</h3>
               <p className="text-zinc-400 font-light leading-relaxed">Detects commit time drift, new-author surges, and issue reply latency spikes completely within your data warehouse.</p>
            </div>
            <div className="p-8 md:p-12 flex flex-col gap-4 transition-colors hover:bg-zinc-800/20 group">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                 <Search className="w-6 h-6 text-indigo-400" />
               </div>
               <h3 className="text-xl font-semibold text-zinc-100 mt-2">Risk Index</h3>
               <p className="text-zinc-400 font-light leading-relaxed">Combines tone + activity velocity into an actionable early-warning index ranging from 0 to 100.</p>
            </div>
          </div>
        </section>

        {/* 3. Demo Comparison Section */}
        <section id="demo" className="relative w-full px-6 md:px-12 py-24 bg-[#0c0c0c]">
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent h-[1px]" />
          <div className="max-w-[1440px] mx-auto flex flex-col items-center">
            <div className="text-center max-w-3xl space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 uppercase tracking-widest mx-auto">
                Case Study
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-100">
                Stop silent supply chain attacks.
              </h2>
              <p className="text-lg text-zinc-400 font-light leading-relaxed">
                See how Ghost Maintainer detects real-world supply chain attacks like
                xz-utils (CVE-2024-3094) before malicious code was even merged into the main branch.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-zinc-800/60 bg-[#0A0A0A] p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <DemoComparison />
            </div>
          </div>
        </section>

        {/* 4. Dependency Scanner */}
        <section id="scanner" className="relative w-full px-6 md:px-12 py-24 bg-[#0A0A0A]">
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent h-[1px]" />
          <div className="max-w-[1440px] mx-auto flex flex-col items-center">
            <div className="text-center max-w-3xl space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 uppercase tracking-widest mx-auto">
                Deep Audit
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-100">
                Audit dependencies automatically.
              </h2>
              <p className="text-lg text-zinc-400 font-light leading-relaxed">
                Audit dependencies from <code className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 text-sm">package.json</code> or{" "}
                <code className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 text-sm">requirements.txt</code> to rank libraries
                by maintainer burnout and fragility.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-zinc-800/60 bg-[#0c0c0c] shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
               <DependencyScannerCard />
            </div>
          </div>
        </section>

        {/* 5. SQL Engine Showcase */}
        <section id="sql" className="relative w-full px-6 md:px-12 py-24 bg-[#0c0c0c]">
          <div className="absolute inset-x-0 top-0 bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent h-[1px]" />
          <div className="max-w-[1440px] mx-auto flex flex-col items-center">
            <div className="text-center max-w-3xl space-y-6 mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 uppercase tracking-widest mx-auto">
                In-Warehouse
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-100">
                The 5 Behavioral Signals in Pure SQL
              </h2>
              <p className="text-lg text-zinc-400 font-light leading-relaxed">
                Statistical window functions, L1 distribution drift, and Z-score
                deviation run directly in Postgres or Snowflake without exporting
                code or credentials.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-zinc-800/60 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A0A0A]">
              <SqlSignalsShowcase />
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="w-full border-t border-zinc-900 py-12 px-6 md:px-12 bg-[#0A0A0A] relative z-10">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-zinc-500">
          <div className="text-center md:text-left">
            <p className="font-medium text-zinc-300 mb-1 flex items-center gap-2 justify-center md:justify-start">
              <Image src="/logo.png" alt="Ghost Maintainer" width={20} height={20} className="w-5 h-5 rounded object-contain" />
              Ghost Maintainer
            </p>
            <p className="font-light">
              Predicting open-source supply chain failure before the CVE is published.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-medium">
            <a href="#demo" className="hover:text-zinc-300 transition-colors">Live Demo</a>
            <a href="#scanner" className="hover:text-zinc-300 transition-colors">Scanner</a>
            <a href="#sql" className="hover:text-zinc-300 transition-colors">SQL Engine</a>
            <a href="https://github.com/nonsense3/Ghost-Maintainer" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

