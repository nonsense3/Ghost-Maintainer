import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// OWASP A04: API Rate Limiting to prevent abuse
// Allows 5 requests per 10 seconds per IP with graceful fallback when Upstash is unconfigured
let limiterInstance: { limit: (identifier: string) => Promise<{ success: boolean }> } | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    limiterInstance = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
  }
} catch {
  limiterInstance = null;
}

export const ratelimit = {
  async limit(identifier: string) {
    if (limiterInstance) {
      return limiterInstance.limit(identifier);
    }
    return { success: true };
  },
};
