// lib/rateLimit/rateLimitStore.ts

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitRecord>();

export function getRateLimitRecord(key: string): RateLimitRecord {
  const now = Date.now();
  const existing = store.get(key);

  // reset daily (UTC midnight style simplified)
  if (!existing || existing.resetAt < now) {
    const tomorrow = now + 24 * 60 * 60 * 1000;
    const record = { count: 0, resetAt: tomorrow };
    store.set(key, record);
    return record;
  }

  return existing;
}

export function incrementRateLimit(key: string) {
  const record = getRateLimitRecord(key);
  record.count += 1;
  store.set(key, record);
  return record;
}
