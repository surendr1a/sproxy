import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ApiKey } from "@/lib/models/ApiKey"
import { Session } from "@/lib/models/Session"
import crypto from "crypto"
import { trackEvent } from "@/lib/analytics/trackEvent"
import { resolveWorkspaceForUser } from "@/lib/auth/rbac"
import { User } from "@/lib/models/User"

function generateApiKey() {
  return `pk_${crypto.randomBytes(24).toString("hex")}`
}

function maskApiKey(key: string) {
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

export async function GET(req: NextRequest) {
  await connectDB()

  const sessionId = (await cookies()).get("session")?.value
  if (!sessionId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const session = await Session.findById(sessionId)
  if (!session || (session.expiresAt && session.expiresAt < new Date()))
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })

  const workspaceId = await resolveWorkspaceForUser(
    session.userId.toString(),
    req.nextUrl.searchParams.get("workspaceId"),
    "viewer"
  )
  if (!workspaceId) {
    return NextResponse.json({ error: "No accessible workspace found" }, { status: 403 })
  }

  const apiKeys = await ApiKey.find({ userId: session.userId, workspaceId })

  return NextResponse.json({
    workspaceId,
    apiKeys: apiKeys.map((k) => ({
      id: k._id,
      maskedKey: k.maskedKey,
      key: k.key,
      status: k.status,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  await connectDB()

  const sessionId = (await cookies()).get("session")?.value
  if (!sessionId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const session = await Session.findById(sessionId)
  if (!session || (session.expiresAt && session.expiresAt < new Date()))
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })

  let requestedWorkspaceId: string | null = null
  try {
    const body = await req.json()
    requestedWorkspaceId = body?.workspaceId || null
  } catch {}

  const workspaceId = await resolveWorkspaceForUser(
    session.userId.toString(),
    requestedWorkspaceId,
    "admin"
  )
  if (!workspaceId) {
    return NextResponse.json({ error: "No accessible workspace found" }, { status: 403 })
  }

  const user = await User.findById(session.userId).select("planId")
  const snapshot = user?.planId || "free"

  const key = generateApiKey()

  const apiKey = await ApiKey.create({
    userId: session.userId,
    workspaceId,
    key,
    maskedKey: maskApiKey(key),
    status: "active",
    planSnapshot: snapshot,
  })

  await trackEvent({
    userId: session.userId.toString(),
    event: "api_key_created",
    source: "dashboard.api_keys",
  })

  return NextResponse.json({
    apiKey: {
      id: apiKey._id,
      maskedKey: apiKey.maskedKey,
      key: apiKey.key,
      status: apiKey.status,
      createdAt: apiKey.createdAt,
    },
  })
}
