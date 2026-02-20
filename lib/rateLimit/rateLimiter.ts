// lib/rateLimit/rateLimiter.ts

import { incrementRateLimit } from "./rateLimitStore";
import { PlanType } from "@/lib/guards/requestGuards";

const FREE_LIMIT = 100;
const PAID_LIMIT = 10_000;

export async function checkRateLimit(apiKey: string, plan: PlanType) {
  const record = await incrementRateLimit(apiKey);

  // 👇 paid plans
  const isPaid =
    plan === "starter" ||
    plan === "pro" ||
    plan === "business" ||
    plan === "enterprise";

  const limit = isPaid ? PAID_LIMIT : FREE_LIMIT;

  if (record.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}
