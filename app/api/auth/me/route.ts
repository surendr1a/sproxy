// app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/getAuthUser"
import { getUsageSummary } from "@/lib/usage/getUsageSummary"
import { plans } from "@/lib/billing/plans"

export async function GET() {
  const user = await getAuthUser()

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  const { usage } = await getUsageSummary({
    userId: user.id,
    planId: user.planId,
    trialRequestsRemaining: user.trialRequestsRemaining || 0,
  })

  const currentPlan = user.planId
    ? plans.find((p) => p.id === user.planId) || null
    : null

  return NextResponse.json({
    user,
    usage,
    currentPlan,
  })
}
