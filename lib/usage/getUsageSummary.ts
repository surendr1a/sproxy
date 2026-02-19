import { UsageLog } from "@/lib/models/UsageLog";
import { plans } from "@/lib/billing/plans";

export async function getUsageSummary({
  userId,
  planId,
  trialRequestsRemaining,
}: {
  userId: string;
  planId?: string | null;
  trialRequestsRemaining: number;
}) {
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const [monthlyLogs, todayLog, dailyLogs] = await Promise.all([
    UsageLog.find({
      userId,
      date: { $regex: `^${monthPrefix}` },
    }),
    UsageLog.findOne({ userId, date: today }),
    UsageLog.find({ userId }).sort({ date: 1 }).limit(30),
  ]);

  const thisMonth = monthlyLogs.reduce((sum, l) => sum + (l.requestCount || 0), 0);
  const failed = monthlyLogs.reduce((sum, l) => sum + (l.failedCount || 0), 0);
  const todayCount = todayLog?.requestCount || 0;

  const plan = planId ? plans.find((p) => p.id === planId) : null;
  const limit = plan?.monthlyRequestLimit || 50;
  const remaining = planId
    ? Math.max(limit - thisMonth, 0)
    : Math.max(trialRequestsRemaining, 0);

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
