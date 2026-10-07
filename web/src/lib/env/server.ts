import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1).optional(),
  OLLAMA_HOST: z.string().url().default("http://127.0.0.1:11434"),
  GEMMA_MODEL: z.string().default("gemma2:9b"),
  GEMMA_API_KEY: z.string().min(1).optional(),
  GEMMA_API_BASE_URL: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Validated secrets — import only from server code (Route Handlers, Server Actions, lib marked server-only). */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Missing or invalid server environment variables: ${missing}. Copy web/.env.example to web/.env.local.`,
    );
  }
  cached = parsed.data;
  return cached;
}
