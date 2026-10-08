import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import snowflake from "snowflake-sdk";

export async function GET() {
  let supabaseOk = false;
  let supabaseError = null;
  let usersCount = 0;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      supabaseError = error.message;
    } else {
      supabaseOk = true;
      usersCount = data?.users?.length ?? 0;
    }
  } catch (err: unknown) {
    supabaseError = err instanceof Error ? err.message : String(err);
  }

  // Snowflake connection test
  let snowflakeOk = false;
  let snowflakeError = null;
  let snowflakeInfo = null;

  try {
    const account = process.env.SNOWFLAKE_ACCOUNT;
    const user = process.env.SNOWFLAKE_USER;
    const password = process.env.SNOWFLAKE_PASSWORD;
    const warehouse = process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH";
    const database = process.env.SNOWFLAKE_DATABASE || "GHOST_MAINTAINER";
    const schema = process.env.SNOWFLAKE_SCHEMA || "ANALYTICS";

    if (account && user && password) {
      const conn = snowflake.createConnection({
        account,
        username: user,
        password,
        warehouse,
        database,
        schema,
      });

      await new Promise<boolean>((resolve, reject) => {
        conn.connect((err) => {
          if (err) return reject(err);
          conn.execute({
            sqlText: "SELECT CURRENT_USER(), CURRENT_WAREHOUSE(), CURRENT_DATABASE(), CURRENT_SCHEMA()",
            complete: (qErr, _stmt, rows) => {
              conn.destroy((_dErr) => {});
              if (qErr) return reject(qErr);
              snowflakeOk = true;
              snowflakeInfo = rows?.[0] || null;
              resolve(true);
            },
          });
        });
      });
    } else {
      snowflakeError = "Missing SNOWFLAKE credentials";
    }
  } catch (sErr: unknown) {
    snowflakeError = sErr instanceof Error ? sErr.message : String(sErr);
  }

  const isDev = process.env.NODE_ENV !== "production";

  return NextResponse.json({
    ok: true,
    service: "ghost-maintainer-web",
    status: supabaseOk && snowflakeOk ? "healthy" : "degraded",
    supabase: {
      connected: supabaseOk,
      error: isDev ? supabaseError : (supabaseError ? "Connection failed" : null),
      serviceKeyConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    snowflake: {
      connected: snowflakeOk,
      error: isDev ? snowflakeError : (snowflakeError ? "Connection failed" : null),
      configured: Boolean(process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USER),
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
    },
  });
}



