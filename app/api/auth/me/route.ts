// app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/getAuthUser"
import { getUsageSummary } from "@/lib/usage/getUsageSummary"
import { plans } from "@/lib/billing/plans"
import { resolveWorkspaceForUser } from "@/lib/auth/rbac"
import { Subscription } from "@/lib/models/Subscription"

export async function GET() {
  const user = await getAuthUser()

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  const workspaceId = await resolveWorkspaceForUser(user.id, null, "viewer")
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
  }

  const { usage } = await getUsageSummary({
    userId: user.id,
    workspaceId,
    planId: user.planId,
    trialRequestsRemaining: user.trialRequestsRemaining || 0,
    paidRequestsRemaining: user.paidRequestsRemaining,
  })

  const currentPlan = user.planId
    ? plans.find((p) => p.id === user.planId) || null
    : null
  const currentPlanLimit = currentPlan?.monthlyRequestLimit || 0
  const totalRemaining = usage.remaining
  const currentPlanRemaining = user.planId
    ? Math.min(totalRemaining, currentPlanLimit)
    : Math.max(user.trialRequestsRemaining || 0, 0)
  const previousCarryoverRemaining = user.planId
    ? Math.max(totalRemaining - currentPlanRemaining, 0)
    : 0

  const subscriptions = await Subscription.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .select("planId status provider renewsAt startedAt canceledAt createdAt")

  return NextResponse.json({
    user: { ...user, workspaceId },
    usage,
    currentPlan,
    requestCredits: {
      totalRemaining,
      currentPlanRemaining,
      previousCarryoverRemaining,
    },
    subscriptions: subscriptions.map((s) => ({
      id: s._id.toString(),
      planId: s.planId,
      status: s.status,
      provider: s.provider || "unknown",
      renewsAt: s.renewsAt || null,
      startedAt: s.startedAt || s.createdAt || null,
      canceledAt: s.canceledAt || null,
      createdAt: s.createdAt || null,
    })),
  })
}
