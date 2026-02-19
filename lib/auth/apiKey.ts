// lib/auth/apiKey.ts
import { PlanType } from "@/lib/guards/requestGuards";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/lib/models/ApiKey";

/**
 * Demo API key store
 * (baad me DB se aayega)
 */
const API_KEYS: Record<
  string,
  {
    plan: PlanType;
    userId?: string;
  }
> = {
  "free-demo-key": {
    plan: "free",
  },
  "paid-demo-key": {
    plan: "pro",
    userId: "demo-user-id-123",
  },
};

export type AuthContext = {
  userId?: string;
  apiKey: string;
  plan: PlanType;
};

const PLAN_MAP: Record<string, PlanType> = {
  free: "free",
  starter: "starter",
  pro: "pro",
  business: "business",
  enterprise: "enterprise",
};

export async function verifyApiKey(apiKey?: string): Promise<AuthContext | null> {
  if (!apiKey) return null;

  await connectDB();

  const dbKey = await ApiKey.findOne({ key: apiKey }).select(
    "userId status planSnapshot"
  );

  if (dbKey) {
    if (dbKey.status !== "active") return null;

    return {
      apiKey,
      userId: dbKey.userId?.toString(),
      plan: PLAN_MAP[dbKey.planSnapshot || "free"] || "free",
    };
  }

  // fallback demo keys for local/dev testing
  const key = API_KEYS[apiKey];
  if (!key) return null;

  return {
    apiKey,
    plan: key.plan,
    userId: key.userId,
  };
}
