import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"

import { Session } from "@/lib/models/Session"
import { User } from "@/lib/models/User"
import { UsageLog } from "@/lib/models/UsageLog"
import { plans } from "@/lib/billing/plans"

export async function GET() {
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

    /* ---------- PLAN LIMIT ---------- */
    let limit = 50 // free trial default

    if (user.planId) {
      const plan = plans.find((p) => p.id === user.planId)
      if (plan && (plan as any).monthlyRequestLimit) {
        limit = (plan as any).monthlyRequestLimit
      }
    }

    /* ---------- USAGE (MONTH) ---------- */
    const monthPrefix = new Date().toISOString().slice(0, 7) // YYYY-MM

    const monthlyLogs = await UsageLog.find({
      userId: user._id,
      date: { $regex: `^${monthPrefix}` },
    })

    const thisMonth = monthlyLogs.reduce(
      (sum, l) => sum + (l.requestCount || 0),
      0
    )

    const failedThisMonth = monthlyLogs.reduce(
      (sum, l) => sum + (l.failedCount || 0),
      0
    )

    const remaining = Math.max(limit - thisMonth, 0)

    /* ---------- DAILY (LAST 30 DAYS) ---------- */
    const dailyLogs = await UsageLog.find({ userId: user._id })
      .sort({ date: 1 })
      .limit(30)

    return NextResponse.json({
      summary: {
        thisMonth,
        failed: failedThisMonth,
        remaining,
        limit,
        percentUsed: Math.round((thisMonth / limit) * 100),
      },

      daily: dailyLogs.map((l) => ({
        date: l.date,
        requests: l.requestCount,
        failed: l.failedCount,
      })),

      warnings: {
        trialExpired: !user.planId && user.trialRequestsRemaining <= 0,
        limitReached: remaining <= 0,
        nearLimit: remaining > 0 && remaining <= limit * 0.1,
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
