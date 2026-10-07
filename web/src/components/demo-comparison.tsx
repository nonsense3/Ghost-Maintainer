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
      ? "#cc3300"
      : scenario.band === "medium"
        ? "#b37400"
        : "#0066cc";

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-8">
      {/* Scenario Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-1.5 bg-canvas rounded-full border border-hairline shadow-sm max-w-xl mx-auto">
        {SCENARIOS.map((s) => {
          const isSelected = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              className={`px-4 py-2 rounded-full text-caption transition-all font-medium ${
                isSelected
                  ? "bg-ink text-on-dark shadow-sm"
                  : "text-ink hover:text-primary"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Main Comparison Glass Card */}
      <div className="store-utility-card bg-canvas border border-hairline rounded-[22px] p-6 sm:p-10 shadow-sm transition-all">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-hairline">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-display-md text-ink tracking-tight font-semibold">
                {scenario.name}
              </h3>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: bandColor }}
              >
                {scenario.band} Risk
              </span>
            </div>
            <p className="text-body text-ink-muted-80 mt-1">{scenario.tagline}</p>
          </div>

          {/* Quick Score Metrics */}
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="text-center">
              <span className="text-caption text-ink-muted-48 block">Linguistic</span>
              <span className="text-display-lg text-ink font-semibold">
                {scenario.linguisticScore}
              </span>
            </div>
            <div className="text-2xl text-ink-muted-48 font-light">+</div>
            <div className="text-center">
              <span className="text-caption text-ink-muted-48 block">Velocity</span>
              <span className="text-display-lg text-ink font-semibold">
                {scenario.velocityScore}
              </span>
            </div>
            <div className="text-2xl text-ink-muted-48 font-light">=</div>
            <div className="text-center px-4 py-2 rounded-xl bg-canvas-parchment">
              <span className="text-caption text-ink-muted-48 block">Risk Score</span>
              <span
                className="text-hero text-5xl font-bold tabular-nums"
                style={{ color: bandColor }}
              >
                {scenario.riskScore}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Behavioral Signals Grid */}
        <div className="py-8 border-b border-hairline">
          <h4 className="text-body-strong text-ink mb-2">
            Behavioral Drift Signals (PRD §5 SQL Window Functions)
          </h4>
          <p className="text-caption text-ink-muted-48 mb-6">
            Evaluated directly in Postgres / Snowflake over 30-day vs 90-day activity baselines.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(scenario.signals).map(([key, data]) => {
              const sigColor =
                data.score >= 70
                  ? "#cc3300"
                  : data.score >= 35
                    ? "#b37400"
                    : "#0066cc";
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-canvas-parchment border border-hairline/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-caption-strong text-ink capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span
                        className="text-caption font-bold tabular-nums"
                        style={{ color: sigColor }}
                      >
                        {data.score}/100
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-hairline rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${data.score}%`,
                          backgroundColor: sigColor,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-caption text-ink-muted-80 leading-relaxed text-[13px]">
                    {data.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gemma Linguistic Analysis */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-body-strong text-ink">
              Gemma Linguistic Flags (Ollama / Cortex Zero-Egress)
            </h4>
            <span className="text-caption text-ink-muted-48">
              {scenario.gemmaFlags.length} flagged comments
            </span>
          </div>

          {scenario.gemmaFlags.length === 0 ? (
            <div className="p-6 rounded-xl bg-canvas-parchment text-center">
              <p className="text-body text-ink-muted-80">
                ✓ No high-risk language detected. Communications adhere to healthy multi-contributor norms.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scenario.gemmaFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-canvas-parchment border border-hairline/90 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-caption-strong text-ink">
                      {flag.author}
                    </span>
                    <div className="flex items-center gap-2">
                      {flag.signals.map((sig) => (
                        <span
                          key={sig}
                          className="px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-800 font-mono"
                        >
                          {sig}
                        </span>
                      ))}
                      <span className="text-caption-strong text-red-600 font-bold ml-1">
                        Risk {flag.score}
                      </span>
                    </div>
                  </div>
                  <blockquote className="border-l-2 border-red-500 pl-3 italic text-caption text-ink text-[14px]">
                    "{flag.quote}"
                  </blockquote>
                  <p className="text-caption text-ink-muted-80 text-[13px]">
                    <span className="font-semibold text-ink">Gemma Analysis:</span>{" "}
                    {flag.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
