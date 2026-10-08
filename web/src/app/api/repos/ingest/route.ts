import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRepository } from "@/lib/github/client";
import { collectRepositoryEvents } from "@/lib/github/ingest";
import { getUserGitHubToken } from "@/lib/github/token";
import { syncRepositoryToSnowflake } from "@/lib/snowflake/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
});

import { ratelimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // OWASP A04: API Rate Limiting
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  try {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many repository scan requests. Please try again later." },
        { status: 429 }
      );
    }
  } catch (e) {
    // If Redis is not configured (UPSTASH_REDIS_REST_URL is missing), we'll gracefully pass
    console.warn("Rate limiting failed (Upstash Redis might not be configured):", e);
  }


  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid repository owner or name format" }, { status: 400 });
  }

  try {
    // Resolve user's stored OAuth token or fallback
    const userToken = await getUserGitHubToken(user.id);
    const meta = await getRepository(owner, name, userToken);

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
        { error: repoError?.message ?? "Failed to save repository" },
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
        return NextResponse.json({ error: ingestError.message }, { status: 500 });
      }
    }

    // Automatically replicate to Snowflake Zero-Egress storage
    try {
      await syncRepositoryToSnowflake(repoRow.id);
    } catch (sErr) {
      console.warn("[Snowflake Ingest Sync Warning]:", sErr);
    }

    return NextResponse.json({
      repository_id: repoRow.id,
      full_name: meta.full_name,
      ingested_events: rows.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
