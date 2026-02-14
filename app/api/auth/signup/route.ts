// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { Session } from "@/lib/models/Session"
import { hashPassword } from "@/lib/auth/password"

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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    // 1️⃣ Create user
    const user = await User.create({
      email,
      passwordHash,
    })

    // 2️⃣ Create session
    const session = await Session.create({
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    // 3️⃣ Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", session._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
    console.error("Signup error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
