import { plans } from "@/lib/billing/plans";
import { UsageLog } from "@/lib/models/UsageLog";
import { User } from "@/lib/models/User";
import { Subscription } from "@/lib/models/Subscription";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

async function getLegacyRemainingForCurrentPlan(userId: string, planId: string) {
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return 0;

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const monthLogs = await UsageLog.find({
    userId,
    date: { $regex: `^${monthPrefix}` },
  }).select("requestCount");

  const used = monthLogs.reduce((sum, log) => sum + (log.requestCount || 0), 0);
  return Math.max(plan.monthlyRequestLimit - used, 0);
}

async function getMinimumRemainingFromThisMonthPurchases(userId: string) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setUTCMonth(nextMonthStart.getUTCMonth() + 1);

  const [subs, monthLogs] = await Promise.all([
    Subscription.find({
      userId,
      createdAt: { $gte: monthStart, $lt: nextMonthStart },
    }).select("planId"),
    UsageLog.find({
      userId,
      date: { $regex: `^${new Date().toISOString().slice(0, 7)}` },
    }).select("requestCount"),
  ]);

  const purchasedLimit = subs.reduce((sum, s) => {
    const plan = plans.find((p) => p.id === s.planId);
    return sum + (plan?.monthlyRequestLimit || 0);
  }, 0);

  const used = monthLogs.reduce((sum, log) => sum + (log.requestCount || 0), 0);
  return Math.max(purchasedLimit - used, 0);
}

export async function computeCarryoverPaidRequests(userId: string) {
  const user = await User.findById(userId).select("planId paidRequestsRemaining");
  if (!user) return 0;

  const [legacyRemaining, purchasedThisMonthRemaining] = await Promise.all([
    user.planId ? getLegacyRemainingForCurrentPlan(userId, user.planId) : Promise.resolve(0),
    getMinimumRemainingFromThisMonthPurchases(userId),
  ]);

  if (isNumber(user.paidRequestsRemaining)) {
    return Math.max(user.paidRequestsRemaining, legacyRemaining, purchasedThisMonthRemaining, 0);
  }

  return Math.max(legacyRemaining, purchasedThisMonthRemaining, 0);
}

export async function grantPlanRequests({
  userId,
  planId,
  renewsAt,
}: {
  userId: string;
  planId: string;
  renewsAt: Date;
}) {
  const plan = plans.find((p) => p.id === planId);
  if (!plan) throw new Error("Invalid plan for request credits");

  const carryover = await computeCarryoverPaidRequests(userId);
  const nextPaidRequestsRemaining = carryover + plan.monthlyRequestLimit;

  await User.findByIdAndUpdate(userId, {
    planId,
    planExpiresAt: renewsAt,
    paidRequestsRemaining: nextPaidRequestsRemaining,
    trialRequestsRemaining: 0,
  });

  return { carryover, nextPaidRequestsRemaining };
}
