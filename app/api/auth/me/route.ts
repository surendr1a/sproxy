// app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/getAuthUser"
import { getUsageSummary } from "@/lib/usage/getUsageSummary"
import { plans } from "@/lib/billing/plans"
import { resolveWorkspaceForUser } from "@/lib/auth/rbac"

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
  })

  const currentPlan = user.planId
    ? plans.find((p) => p.id === user.planId) || null
    : null

  return NextResponse.json({
    user: { ...user, workspaceId },
    usage,
    currentPlan,
  })
}
