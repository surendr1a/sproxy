// lib/auth/getAuthUser.ts
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Session } from "@/lib/models/Session"
import { User } from "@/lib/models/User"
import mongoose from "mongoose"

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
      "_id email role status trialRequestsRemaining planId planExpiresAt createdAt"
    )

    if (!user || user.status !== "active") return null

    // 4️⃣ Update last active (optional but good)
    await User.findByIdAndUpdate(user._id, {
      lastActiveAt: new Date(),
    })

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      trialRequestsRemaining: user.trialRequestsRemaining,
      planId: user.planId,
      planExpiresAt: user.planExpiresAt,
      createdAt: user.createdAt,
    }
  } catch (err) {
    console.error("getAuthUser error:", err)
    return null
  }
}
