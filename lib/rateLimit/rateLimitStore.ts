// lib/rateLimit/rateLimitStore.ts
import { connectDB } from "@/lib/db";
import { RateLimitCounter } from "@/lib/models/RateLimitCounter";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

function getUtcDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function nextUtcMidnight(now = new Date()) {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return next;
}

export async function incrementRateLimit(key: string): Promise<RateLimitRecord> {
  await connectDB();

  const now = new Date();
  const dateKey = getUtcDateKey(now);
  const expiresAt = nextUtcMidnight(now);

  const doc = await RateLimitCounter.findOneAndUpdate(
    { key, dateKey },
    {
      $inc: { count: 1 },
      $setOnInsert: { key, dateKey, expiresAt, count: 0 },
    },
    { upsert: true, new: true }
  ).select("count expiresAt");

  return {
    count: doc?.count || 1,
    resetAt: (doc?.expiresAt || expiresAt).getTime(),
  };
}
