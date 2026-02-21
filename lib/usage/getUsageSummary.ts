import { UsageLog } from "@/lib/models/UsageLog";
import { plans } from "@/lib/billing/plans";

export async function getUsageSummary({
  userId,
  workspaceId,
  planId,
  trialRequestsRemaining,
  paidRequestsRemaining,
}: {
  userId: string;
  workspaceId?: string | null;
  planId?: string | null;
  trialRequestsRemaining: number;
  paidRequestsRemaining?: number | null;
}) {
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const filter: Record<string, unknown> = { userId };
  if (workspaceId) filter.workspaceId = workspaceId;

  const [monthlyLogs, todayLog, dailyLogs] = await Promise.all([
    UsageLog.find({
      ...filter,
      date: { $regex: `^${monthPrefix}` },
    }),
    UsageLog.findOne({ ...filter, date: today }),
    UsageLog.find(filter).sort({ date: 1 }).limit(30),
  ]);

  const thisMonth = monthlyLogs.reduce((sum, l) => sum + (l.requestCount || 0), 0);
  const failed = monthlyLogs.reduce((sum, l) => sum + (l.failedCount || 0), 0);
  const todayCount = todayLog?.requestCount || 0;

  const plan = planId ? plans.find((p) => p.id === planId) : null;
  const legacyRemaining = Math.max((plan?.monthlyRequestLimit || 0) - thisMonth, 0);
  const paidRemaining =
    typeof paidRequestsRemaining === "number"
      ? Math.max(paidRequestsRemaining, 0)
      : legacyRemaining;
  const limit = planId ? thisMonth + paidRemaining : 50;
  const remaining = planId ? paidRemaining : Math.max(trialRequestsRemaining, 0);

  return {
    usage: {
      today: todayCount,
      thisMonth,
      failed,
      remaining,
      limit,
      percentUsed: limit > 0 ? Math.min(Math.round((thisMonth / limit) * 100), 100) : 0,
    },
    daily: dailyLogs.map((l) => ({
      date: l.date,
      requests: l.requestCount || 0,
      failed: l.failedCount || 0,
    })),
  };
}
