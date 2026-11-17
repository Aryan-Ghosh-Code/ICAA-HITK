import { type Db } from "mongodb";
import type { LoginAttemptDoc } from "./db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

/**
 * DB-backed fixed-window rate limiter.
 * @param db - MongoDB database instance
 * @param key - e.g. `${ip}:${name}`
 * @param opts.max - max attempts in the window
 * @param opts.windowMs - window duration in milliseconds
 * @param opts.now - injectable clock (for tests)
 */
export async function hit(
  db: Db,
  key: string,
  opts: { max: number; windowMs: number; now?: Date },
): Promise<RateLimitResult> {
  const now = opts.now ?? new Date();
  const col = db.collection<LoginAttemptDoc>("login_attempts");

  const existing = await col.findOne({ key });

  if (!existing) {
    // First attempt — create a new window
    await col.insertOne({ key, windowStart: now, count: 1 });
    return { allowed: true, retryAfterSec: 0 };
  }

  const windowStart = existing.windowStart;
  const elapsed = now.getTime() - windowStart.getTime();

  if (elapsed > opts.windowMs) {
    // Window expired — reset
    await col.updateOne({ key }, { $set: { windowStart: now, count: 1 } });
    return { allowed: true, retryAfterSec: 0 };
  }

  // Within the window
  const newCount = existing.count + 1;
  await col.updateOne({ key }, { $set: { count: newCount } });

  if (newCount > opts.max) {
    const retryAfterMs = opts.windowMs - elapsed;
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, retryAfterSec: 0 };
}
