import { createClient } from "@/lib/supabase/server";
import { runRepositoryAnalysis } from "@/lib/analytics/run-analysis";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: repo } = await supabase
    .from("repositories")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  try {
    const result = await runRepositoryAnalysis(id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
