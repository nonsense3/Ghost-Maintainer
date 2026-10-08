import { createClient } from "@/lib/supabase/server";
import {
  generateSnowflakeAnalysisSql,
  getSnowflakeConfig,
  maskSnowflakeAccount,
  syncRepositoryToSnowflake,
} from "@/lib/snowflake/client";
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
    .select("id, full_name, owner, name")
    .eq("id", id)
    .maybeSingle();

  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const config = getSnowflakeConfig();

  try {
    const syncResult = await syncRepositoryToSnowflake(id);
    const sql = generateSnowflakeAnalysisSql(repo.full_name);

    return NextResponse.json({
      success: true,
      repository_id: id,
      full_name: repo.full_name,
      sync: syncResult,
      events_staged: syncResult.total_events_in_snowflake,
      snowflake: {
        account: maskSnowflakeAccount(config.account),
        warehouse: config.warehouse,
        database: config.database,
        schema: config.schema,
        cortex_model: "gemma-7b",
        zero_egress: true,
      },
      worksheet_sql: sql,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        repository_id: id,
        full_name: repo.full_name,
      },
      { status: 500 },
    );
  }
}
