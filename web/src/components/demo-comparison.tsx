"use client";

import { useState } from "react";

type Scenario = {
  id: string;
  name: string;
  tagline: string;
  linguisticScore: number;
  velocityScore: number;
  riskScore: number;
  band: "low" | "medium" | "high";
  signals: {
    activity_drop: { score: number; desc: string };
    commit_time_shift: { score: number; desc: string };
    new_author_surge: { score: number; desc: string };
    unreviewed_merges: { score: number; desc: string };
    reply_latency_spike: { score: number; desc: string };
  };
  gemmaFlags: Array<{
    score: number;
    quote: string;
    author: string;
    reason: string;
    signals: string[];
  }>;
};

const SCENARIOS: Scenario[] = [
  {
    id: "xz",
    name: "xz/xz-utils",
    tagline: "2024 Backdoor Takeover (CVE-2024-3094)",
    linguisticScore: 89,
    velocityScore: 82,
    riskScore: 86,
    band: "high",
    signals: {
      activity_drop: {
        score: 78,
        desc: "Weekly commits dropped 78% below 90-day moving baseline as solo maintainer struggled with health issues.",
      },
      commit_time_shift: {
        score: 84,
        desc: "Commit time distribution shifted from European daylight hours (09:00-17:00 UTC) to late night (01:00-04:00 UTC).",
      },
      new_author_surge: {
        score: 92,
        desc: "Unknown persona 'Jia Tan' suddenly authored 92% of new commits without prior historical contributions.",
      },
      unreviewed_merges: {
        score: 85,
        desc: "85% of commits merged without peer reviews or test verification.",
      },
      reply_latency_spike: {
        score: 71,
        desc: "Issue first-reply latency spiked from 4 hours to 18 days (Z-Score +2.8 deviation).",
      },
    },
    gemmaFlags: [
      {
        score: 88,
        author: "Lasse Collin (Original Maintainer)",
        quote: "I haven't lost interest, but my ability to care has been fairly limited mostly due to long term mental health issues but also due to some other things.",
        reason: "Maintainer explicitly communicating chronic burnout and diminishing capacity to review code safely.",
        signals: ["severe_exhaustion", "relinquishing_control", "high_burnout"],
      },
      {
        score: 95,
        author: "Dennis Ens / Jigar Kumar (Coordinated Sockpuppets)",
        quote: "Is there any progress on this? Jia Tan has been working hard and waiting for your commits. Progress will not happen until there is a new maintainer.",
        reason: "Artificial social engineering pressure directed at a vulnerable solo maintainer to surrender repository commit keys.",
        signals: ["social_engineering", "coercive_pressure", "sockpuppet_ring"],
      },
      {
        score: 91,
        author: "Jia Tan (Attacker Account)",
        quote: "CMake: enable test binaries for liblzma build configuration and silence warnings in release scripts.",
        reason: "Vague urgency with obfuscated binary payload injection tucked into test suite changes.",
        signals: ["vague_commit_intent", "unexplained_binary_injection"],
      },
    ],
  },
  {
    id: "event-stream",
    name: "dominictarr/event-stream",
    tagline: "npm Flatmap Supply Chain Attack",
    linguisticScore: 84,
    velocityScore: 78,
    riskScore: 81,
    band: "high",
    signals: {
      activity_drop: {
        score: 82,
        desc: "Original maintainer had zero commits for 180 days prior to transfer.",
      },
      commit_time_shift: {
        score: 65,
        desc: "Time-of-day commits jumped completely across global timezones.",
      },
      new_author_surge: {
        score: 95,
        desc: "New author 'right9ctrl' granted publishing rights after single polite offer.",
      },
      unreviewed_merges: {
        score: 90,
        desc: "Injected flatmap dependency released directly to npm without peer approval.",
      },
      reply_latency_spike: {
        score: 60,
        desc: "Abandoned triage queue abruptly reopened by untrusted newcomer.",
      },
    },
    gemmaFlags: [
      {
        score: 86,
        author: "Dominic Tarr (Maintainer)",
        quote: "He emailed me and said he wanted to maintain the module, so I gave it to him. I haven't used this in years.",
        reason: "Unvetted ownership surrender due to library abandonment fatigue.",
        signals: ["ownership_surrender", "abandonment_fatigue"],
      },
      {
        score: 94,
        author: "right9ctrl (Attacker)",
        quote: "Updated dependencies and streamlined build to reduce package weight.",
        reason: "Harmless-sounding changelog masking malicious Bitcoin wallet key harvester.",
        signals: ["trojan_payload", "deceptive_intent"],
      },
    ],
  },
  {
    id: "flask",
    name: "pallets/flask",
    tagline: "Healthy Multi-Maintainer Community Baseline",
    linguisticScore: 12,
    velocityScore: 14,
    riskScore: 13,
    band: "low",
    signals: {
      activity_drop: {
        score: 8,
        desc: "Steady commit rhythm sustained across multiple team members.",
      },
      commit_time_shift: {
        score: 12,
        desc: "Normal distributed global team hours with continuous CI validation.",
      },
      new_author_surge: {
        score: 15,
        desc: "Healthy contributor onboarding through documented PR triage steps.",
      },
      unreviewed_merges: {
        score: 6,
        desc: "Strict mandatory 2-maintainer approvals on all merged PRs.",
      },
      reply_latency_spike: {
        score: 16,
        desc: "Predictable issue response times maintained by active triagers.",
      },
    },
    gemmaFlags: [],
  },
];

export function DemoComparison() {
  const [activeId, setActiveId] = useState<string>("xz");
  const scenario = SCENARIOS.find((s) => s.id === activeId)!;

  const bandColor =
    scenario.band === "high"
      ? "#ef4444" // red-500
      : scenario.band === "medium"
        ? "#f59e0b" // amber-500
        : "#10b981"; // emerald-500

  return (
    <div className="w-full mx-auto space-y-8 p-2 md:p-6 text-zinc-300">
      {/* Scenario Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-zinc-900/50 rounded-full border border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] w-max mx-auto backdrop-blur-md">
        {SCENARIOS.map((s) => {
          const isSelected = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              className={`px-5 py-2 rounded-full text-sm transition-all font-semibold ${
                isSelected
                  ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Main Comparison Card */}
      <div className="bg-[#0c0c0c] border border-zinc-800/80 rounded-[24px] p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-500 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-zinc-800/80 relative z-10">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h3 className="text-3xl text-zinc-100 tracking-tight font-bold">
                {scenario.name}
              </h3>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#0A0A0A] w-max"
                style={{ backgroundColor: bandColor, boxShadow: `0 0 15px ${bandColor}40` }}
              >
                {scenario.band} Risk
              </span>
            </div>
            <p className="text-base text-zinc-400 mt-2 font-light">{scenario.tagline}</p>
          </div>

          {/* Quick Score Metrics */}
          <div className="flex items-center gap-6 sm:gap-8 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-center">
              <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Linguistic</span>
              <span className="text-3xl text-zinc-100 font-bold">
                {scenario.linguisticScore}
              </span>
            </div>
            <div className="text-2xl text-zinc-600 font-light">+</div>
            <div className="text-center">
              <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Velocity</span>
              <span className="text-3xl text-zinc-100 font-bold">
                {scenario.velocityScore}
              </span>
            </div>
            <div className="text-2xl text-zinc-600 font-light">=</div>
            <div className="text-center pl-4 border-l border-zinc-800">
              <span className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Risk Score</span>
              <span
                className="text-4xl font-black tabular-nums drop-shadow-md"
                style={{ color: bandColor }}
              >
                {scenario.riskScore}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Behavioral Signals Grid */}
        <div className="py-10 border-b border-zinc-800/80 relative z-10">
          <div className="mb-8">
            <h4 className="text-xl font-semibold text-zinc-100 mb-2">
              Behavioral Drift Signals
            </h4>
            <p className="text-sm text-zinc-500 font-light">
              Evaluated directly in Postgres / Snowflake over 30-day vs 90-day activity baselines.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(scenario.signals).map(([key, data]) => {
              const sigColor =
                data.score >= 70
                  ? "#ef4444"
                  : data.score >= 35
                    ? "#f59e0b"
                    : "#10b981";
              return (
                <div
                  key={key}
                  className="p-5 rounded-2xl bg-[#0a0a0a] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between group/card shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-zinc-300 capitalize tracking-wide">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: sigColor }}
                      >
                        {data.score}/100
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mb-4 shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${data.score}%`,
                          backgroundColor: sigColor,
                          boxShadow: `0 0 10px ${sigColor}80`
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed font-light">
                    {data.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gemma Linguistic Analysis */}
        <div className="pt-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h4 className="text-xl font-semibold text-zinc-100 mb-2">
                Gemma Linguistic Flags
              </h4>
              <p className="text-sm text-zinc-500 font-light">
                Local LLM inference via Ollama / Cortex Zero-Egress.
              </p>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 font-medium whitespace-nowrap">
              {scenario.gemmaFlags.length} flagged comment{scenario.gemmaFlags.length !== 1 ? 's' : ''}
            </div>
          </div>

          {scenario.gemmaFlags.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-zinc-300 font-medium">
                No high-risk language detected.
              </p>
              <p className="text-sm text-zinc-500">
                Communications adhere to healthy multi-contributor norms.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scenario.gemmaFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 border border-zinc-700">
                        {flag.author.charAt(0)}
                      </span>
                      {flag.author}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {flag.signals.map((sig) => (
                        <span
                          key={sig}
                          className="px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400 font-semibold"
                        >
                          {sig}
                        </span>
                      ))}
                      <span className="text-xs px-2.5 py-1 rounded-md bg-red-500 text-white font-bold tracking-wider ml-1 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                        RISK {flag.score}
                      </span>
                    </div>
                  </div>
                  <div className="pl-4 py-2 border-l-2 border-red-500/50">
                    <blockquote className="italic text-zinc-300 text-[15px] leading-relaxed">
                      "{flag.quote}"
                    </blockquote>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-zinc-800/80 flex items-start gap-3">
                    <div className="mt-0.5">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                      <span className="font-semibold text-indigo-300">Gemma Insight: </span>
                      {flag.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
