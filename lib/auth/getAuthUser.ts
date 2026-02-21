// lib/auth/getAuthUser.ts
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Session } from "@/lib/models/Session"
import { User } from "@/lib/models/User"
import mongoose from "mongoose"
import { computeCarryoverPaidRequests } from "@/lib/billing/requestCredits"

export async function getAuthUser() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) return null
    if (!mongoose.Types.ObjectId.isValid(sessionId)) return null

    await connectDB()

    // 1️⃣ Find session
    const session = await Session.findById(sessionId)
    if (!session) return null

    // 2️⃣ Check expiry
    if (session.expiresAt && session.expiresAt < new Date()) {
      await Session.findByIdAndDelete(sessionId)
      return null
    }

    // 3️⃣ Load user
    const user = await User.findById(session.userId).select(
      "_id email role status trialRequestsRemaining paidRequestsRemaining planId planExpiresAt createdAt"
    )

    if (!user || user.status !== "active") return null

    // 4️⃣ Keep activity fresh + repair paid request balance if older records missed carryover.
    const updates: Record<string, unknown> = { lastActiveAt: new Date() }
    if (user.planId) {
      const inferredPaidRemaining = await computeCarryoverPaidRequests(user._id.toString())
      if (
        typeof user.paidRequestsRemaining !== "number" ||
        inferredPaidRemaining > user.paidRequestsRemaining
      ) {
        updates.paidRequestsRemaining = inferredPaidRemaining
        user.paidRequestsRemaining = inferredPaidRemaining as any
      }
    }
    await User.findByIdAndUpdate(user._id, updates)

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      trialRequestsRemaining: user.trialRequestsRemaining,
      paidRequestsRemaining: user.paidRequestsRemaining,
      planId: user.planId,
      planExpiresAt: user.planExpiresAt,
      createdAt: user.createdAt,
    }
  } catch (err) {
    console.error("getAuthUser error:", err)
    return null
  }
}
