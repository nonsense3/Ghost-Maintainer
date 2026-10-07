import { createClient } from "@/lib/supabase/server";
import { generateSnowflakeAnalysisSql, getSnowflakeConfig } from "@/lib/snowflake/client";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  if (id.startsWith("demo-")) {
    const demoName = id === "demo-xz" ? "xz/xz-utils" : "pallets/flask";
    const config = getSnowflakeConfig();
    return NextResponse.json({
      success: true,
      repository_id: id,
      full_name: demoName,
      events_staged: 142,
      snowflake: {
        account: config.account ?? "sosbytk-aj02649",
        warehouse: config.warehouse,
        database: config.database,
        schema: config.schema,
        cortex_model: "gemma-7b",
        zero_egress: true,
      },
      worksheet_sql: generateSnowflakeAnalysisSql(demoName),
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  const { data: repo } = await supabase
    .from("repositories")
    .select("id, full_name, owner, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("raw_github_events")
    .select("id", { count: "exact", head: true })
    .eq("repository_id", id);

  const config = getSnowflakeConfig();
  const sql = generateSnowflakeAnalysisSql(repo.full_name);

  return NextResponse.json({
    success: true,
    repository_id: id,
    full_name: repo.full_name,
    events_staged: count ?? 0,
    snowflake: {
      account: config.account ?? "sosbytk-aj02649",
      warehouse: config.warehouse,
      database: config.database,
      schema: config.schema,
      cortex_model: "gemma-7b",
      zero_egress: true,
    },
    worksheet_sql: sql,
  });
}
