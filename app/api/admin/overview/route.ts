import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdminUser } from "@/lib/auth/requireAdminUser";
import { User } from "@/lib/models/User";
import { Subscription } from "@/lib/models/Subscription";
import { UsageLog } from "@/lib/models/UsageLog";
import { plans } from "@/lib/billing/plans";
import { getConfiguredProxyCount } from "@/lib/proxy/getRandomProxy";
import { ProductEvent } from "@/lib/models/ProductEvent";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const [users, activeSubscriptions, monthlyUsage, funnelSignup, funnelPaid] = await Promise.all([
    User.find({}).select("email planId status trialRequestsRemaining createdAt"),
    Subscription.find({ status: "active" }).select("planId status renewsAt"),
    UsageLog.find({ date: { $regex: `^${monthPrefix}` } }).select(
      "userId requestCount failedCount"
    ),
    ProductEvent.distinct("userId", { event: "signup_completed" }),
    ProductEvent.distinct("userId", { event: "plan_subscription_activated" }),
  ]);

  const totalRequests = monthlyUsage.reduce((sum, log) => sum + (log.requestCount || 0), 0);
  const failedRequests = monthlyUsage.reduce((sum, log) => sum + (log.failedCount || 0), 0);

  const usageByUser = new Map<
    string,
    { requests: number; failed: number }
  >();
  for (const log of monthlyUsage) {
    const key = log.userId?.toString();
    if (!key) continue;
    const current = usageByUser.get(key) || { requests: 0, failed: 0 };
    current.requests += log.requestCount || 0;
    current.failed += log.failedCount || 0;
    usageByUser.set(key, current);
  }

  const planMap = new Map(plans.map((p) => [p.id, p]));

  return NextResponse.json({
    stats: {
      totalUsers: users.length,
      activeSubscriptions: activeSubscriptions.length,
      configuredProxies: getConfiguredProxyCount(),
      monthlyRequests: totalRequests,
      failedRequests,
      mrr: activeSubscriptions.reduce((sum, s) => {
        const plan = planMap.get(s.planId);
        return sum + (plan?.price || 0);
      }, 0),
    },
    users: users.map((u) => {
      const usage = usageByUser.get(u._id.toString()) || { requests: 0, failed: 0 };
      return {
        id: u._id.toString(),
        email: u.email,
        plan: u.planId || "trial",
        status: u.status,
        trialRequestsRemaining: u.trialRequestsRemaining || 0,
        requests: usage.requests,
        failed: usage.failed,
        createdAt: u.createdAt,
      };
    }),
    plans: plans.map((p) => ({
      ...p,
      activeSubscriptions: activeSubscriptions.filter((s) => s.planId === p.id).length,
    })),
    proxies: {
      totalConfigured: getConfiguredProxyCount(),
      source: "PROXY_URL/PROXY_POOL",
    },
    funnel: {
      signedUpUsers: funnelSignup.filter(Boolean).length,
      paidUsers: funnelPaid.filter(Boolean).length,
    },
  });
}
