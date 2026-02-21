import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"

import { Session } from "@/lib/models/Session"
import { User } from "@/lib/models/User"
import { getUsageSummary } from "@/lib/usage/getUsageSummary"
import { resolveWorkspaceForUser } from "@/lib/auth/rbac"

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    /* ---------- SESSION ---------- */
    const session = await Session.findById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    /* ---------- USER ---------- */
    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const requestedWorkspaceId = searchParams.get("workspaceId")
    const workspaceId = await resolveWorkspaceForUser(
      user._id.toString(),
      requestedWorkspaceId,
      "viewer"
    )
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
    }

    const { usage, daily } = await getUsageSummary({
      userId: user._id.toString(),
      workspaceId,
      planId: user.planId,
      trialRequestsRemaining: user.trialRequestsRemaining || 0,
      paidRequestsRemaining: user.paidRequestsRemaining,
    })

    return NextResponse.json({
      summary: {
        today: usage.today,
        thisMonth: usage.thisMonth,
        failed: usage.failed,
        remaining: usage.remaining,
        limit: usage.limit,
        percentUsed: usage.percentUsed,
      },

      daily,
      workspaceId,

      warnings: {
        trialExpired: !user.planId && user.trialRequestsRemaining <= 0,
        limitReached: usage.remaining <= 0,
        nearLimit: usage.remaining > 0 && usage.remaining <= usage.limit * 0.1,
      },
    })
  } catch (err) {
    console.error("USAGE API ERROR:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
