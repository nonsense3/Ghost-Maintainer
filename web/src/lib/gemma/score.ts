import "server-only";
import { getServerEnv } from "@/lib/env/server";
import { z } from "zod";

const scoreSchema = z.object({
  risk_score: z.number().min(0).max(100),
  signals: z.array(z.string()),
  reason: z.string(),
});

export type GemmaScore = z.infer<typeof scoreSchema>;

const SYSTEM_PROMPT = `You assess open-source maintainer burnout and hijack risk from a single GitHub comment or issue body.
Compare tone to a tired but honest maintainer vs a hostile takeover — output JSON only:
{"risk_score":0-100,"signals":["..."],"reason":"one sentence"}
Look for: frustration, "I need help maintaining", sudden style change, pushy new contributors, vague urgency.
Be fair: non-native English is not automatically risky. Low confidence if text is very short.`;

export async function scoreTextWithGemma(text: string): Promise<GemmaScore | null> {
  const trimmed = text.trim();
  if (trimmed.length < 12) {
    return {
      risk_score: 0,
      signals: ["insufficient_text"],
      reason: "Not enough text for a confident linguistic score.",
    };
  }

  const { OLLAMA_HOST, OLLAMA_API_KEY, GEMMA_MODEL, GEMMA_API_KEY, GEMMA_API_BASE_URL } =
    getServerEnv();

  if (GEMMA_API_KEY && GEMMA_API_BASE_URL) {
    return scoreViaHttp(GEMMA_API_BASE_URL, GEMMA_API_KEY, GEMMA_MODEL, trimmed);
  }

  return scoreViaOllama(OLLAMA_HOST, GEMMA_MODEL, trimmed, OLLAMA_API_KEY);
}

async function scoreViaOllama(
  host: string,
  model: string,
  text: string,
  apiKey?: string,
): Promise<GemmaScore | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(`${host.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
        },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, 8000) },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      message?: { content?: string };
    };
    return parseModelJson(data.message?.content ?? "");
  } catch {
    return null;
  }
}

async function scoreViaHttp(
  baseUrl: string,
  apiKey: string,
  model: string,
  text: string,
): Promise<GemmaScore | null> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gemma2-9b-it",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, 8000) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return parseModelJson(data.choices?.[0]?.message?.content ?? "");
  } catch {
    return null;
  }
}

function parseModelJson(raw: string): GemmaScore | null {
  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = scoreSchema.safeParse(json);
    if (parsed.success) return parsed.data;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = scoreSchema.safeParse(JSON.parse(match[0]));
        if (parsed.success) return parsed.data;
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}
