import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { Session } from "@/lib/models/Session"
import { verifyPassword } from "@/lib/auth/password"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // ✅ IMPORTANT: delete old sessions
    await Session.deleteMany({ userId: user._id })

    // ✅ create fresh session
    const session = await Session.create({
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const cookieStore = await cookies()
    cookieStore.set("session", session._id.toString(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        trialRequestsRemaining: user.trialRequestsRemaining,
        planId: user.planId,
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
