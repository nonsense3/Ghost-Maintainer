import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// OWASP A04: API Rate Limiting to prevent abuse
// Allows 5 requests per 10 seconds per IP
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});
