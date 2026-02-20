import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/requireAdminUser";
import { ProductEvent } from "@/lib/models/ProductEvent";

const STAGES = [
  "signup_completed",
  "api_key_created",
  "proxy_request_success",
  "plan_checkout_started",
  "plan_subscription_activated",
] as const;

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const stageCounts = await Promise.all(
    STAGES.map(async (stage) => ({
      stage,
      users: await ProductEvent.distinct("userId", { event: stage }),
    }))
  );

  const result = stageCounts.map((s) => ({
    stage: s.stage,
    users: s.users.filter(Boolean).length,
  }));

  return NextResponse.json({ funnel: result });
}
