import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRepository } from "@/lib/github/client";
import { collectRepositoryEvents } from "@/lib/github/ingest";
import { getUserGitHubToken } from "@/lib/github/token";
import { runRepositoryAnalysis } from "@/lib/analytics/run-analysis";
import { syncRepositoryToSnowflake } from "@/lib/snowflake/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to track and scan repositories." },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid repository request format." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid repository name or URL." },
      { status: 400 },
    );
  }

  const { owner: rawOwner, name: rawName } = parsed.data;

  // Auto-detect full GitHub URL (e.g. https://github.com/dasouvik122005/Weblytix) or owner/repo format
  let owner = rawOwner.trim();
  let name = rawName.trim();

  const combined = `${owner} ${name}`;
  const urlMatch = combined.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+)/i);
  if (urlMatch) {
    owner = urlMatch[1];
    name = urlMatch[2].replace(/\.git$/i, "");
  } else if (name.includes("/")) {
    const parts = name.split("/").map((p) => p.trim());
    if (parts[0] && parts[1]) {
      owner = parts[0];
      name = parts[1].replace(/\.git$/i, "");
    }
  } else if (owner.includes("/")) {
    const parts = owner.split("/").map((p) => p.trim());
    if (parts[0] && parts[1]) {
      owner = parts[0];
      name = parts[1].replace(/\.git$/i, "");
    }
  }

  // OWASP A10: SSRF Prevention & Input Validation
  const repoRegex = /^[a-zA-Z0-9_.-]+$/;
  if (!repoRegex.test(owner) || !repoRegex.test(name)) {
    return NextResponse.json(
      { error: "Invalid repository name format. Use owner/repo or a GitHub link." },
      { status: 400 },
    );
  }

  try {
    // Resolve user's stored OAuth token or fallback
    const userToken = await getUserGitHubToken(user.id);
    let meta;
    try {
      meta = await getRepository(owner, name, userToken);
    } catch {
      return NextResponse.json(
        {
          error: `Could not find "${owner}/${name}" on GitHub. Please make sure the repository is public or you have granted access.`,
        },
        { status: 404 },
      );
    }

    const { data: repoRow, error: repoError } = await supabase
      .from("repositories")
      .upsert(
        {
          user_id: user.id,
          owner,
          name,
          default_branch: meta.default_branch,
        },
        { onConflict: "user_id,owner,name" },
      )
      .select("id")
      .single();

    if (repoError || !repoRow) {
      return NextResponse.json(
        { error: "We could not save this repository right now. Please try again." },
        { status: 500 },
      );
    }

    const collected = await collectRepositoryEvents(owner, name, userToken);
    const admin = createAdminClient();
    const rows = collected.map((ev) => ({
      repository_id: repoRow.id,
      source: ev.source,
      external_id: ev.external_id,
      occurred_at: ev.occurred_at,
      payload: ev.payload,
    }));

    if (rows.length > 0) {
      const { error: ingestError } = await admin
        .from("raw_github_events")
        .upsert(rows, { onConflict: "repository_id,source,external_id" });

      if (ingestError) {
        console.warn("[Ingest Upsert Warning]:", ingestError.message);
      }
    }

    // Automatically trigger initial security and maintainer health analysis
    let analysisResult = null;
    try {
      analysisResult = await runRepositoryAnalysis(repoRow.id);
    } catch (aErr) {
      console.warn("[Initial Security Analysis Notice]:", aErr);
      try {
        await syncRepositoryToSnowflake(repoRow.id);
      } catch (sErr) {
        console.warn("[Snowflake Sync Notice]:", sErr);
      }
    }

    const statusWord =
      analysisResult && analysisResult.risk_score <= 33
        ? "Secure & Clean"
        : analysisResult && analysisResult.risk_score <= 66
        ? "Review Recommended"
        : analysisResult
        ? "Threat Flagged"
        : "Ready to Scan";

    return NextResponse.json({
      repository_id: repoRow.id,
      full_name: meta.full_name,
      ingested_events: rows.length,
      analysis: analysisResult,
      status_word: statusWord,
      message: `Successfully connected ${meta.full_name} and audited ${rows.length} code events.`,
    });
  } catch (e) {
    const rawMsg = e instanceof Error ? e.message : "Ingest failed";
    let friendly = "We encountered a temporary connection issue. Please try again in a moment.";

    if (rawMsg.toLowerCase().includes("not found")) {
      friendly = "Repository not found on GitHub. Please check the spelling or link.";
    } else if (rawMsg.toLowerCase().includes("rate limit")) {
      friendly = "GitHub rate limit reached. Please wait a few moments and try again.";
    } else if (rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("unique")) {
      friendly = "This repository is already being tracked in your dashboard.";
    }

    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
