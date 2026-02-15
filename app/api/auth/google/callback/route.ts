import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { Session } from "@/lib/models/Session"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) return NextResponse.redirect("/login")

  // 1️⃣ Exchange code → token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })

  const token = await tokenRes.json()

  // 2️⃣ Get user info
  const userRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    }
  )

  const googleUser = await userRes.json()

  if (!googleUser.email) {
    console.error("Google user:", googleUser)
    return NextResponse.redirect("/login?error=no_email")
  }

  await connectDB()

  // 3️⃣ Find or create user
  let user = await User.findOne({ email: googleUser.email })

  if (!user) {
    user = await User.create({
      email: googleUser.email,
      passwordHash: "google-auth", // dummy
    })
  }

  // 4️⃣ Create session
  const session = await Session.create({
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  ;(await cookies()).set("session", session._id.toString(), {
    httpOnly: true,
    path: "/",
  })

  return NextResponse.redirect(
    new URL("/dashboard", req.url)
  )
}
