import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRepository } from "@/lib/github/client";
import { collectRepositoryEvents } from "@/lib/github/ingest";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { owner, name } = parsed.data;

  try {
    const meta = await getRepository(owner, name);

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

    const collected = await collectRepositoryEvents(owner, name);
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
