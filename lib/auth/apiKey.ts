// lib/auth/apiKey.ts
import { PlanType } from "@/lib/guards/requestGuards";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/lib/models/ApiKey";
import { User } from "@/lib/models/User";

export type AuthContext = {
  userId?: string;
  apiKey: string;
  plan: PlanType;
  workspaceId?: string | null;
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
    "userId workspaceId status planSnapshot"
  );

  if (dbKey) {
    if (dbKey.status !== "active") return null;

    let plan = PLAN_MAP[dbKey.planSnapshot || "free"] || "free";
    if (!dbKey.planSnapshot && dbKey.userId) {
      const user = await User.findById(dbKey.userId).select("planId");
      plan = PLAN_MAP[user?.planId || "free"] || "free";
      await ApiKey.updateOne({ _id: dbKey._id }, { planSnapshot: plan });
    }

    return {
      apiKey,
      userId: dbKey.userId?.toString(),
      plan,
      workspaceId: dbKey.workspaceId?.toString() || null,
    };
  }

  return null;
}
