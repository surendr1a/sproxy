// lib/auth/apiKey.ts
import { PlanType } from "@/lib/guards/requestGuards";

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

export function verifyApiKey(apiKey?: string): AuthContext | null {
  if (!apiKey) return null;

  const key = API_KEYS[apiKey];
  if (!key) return null;

  return {
    apiKey,
    plan: key.plan,
    userId: key.userId,
  };
}
