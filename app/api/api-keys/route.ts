import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { ApiKey } from "@/lib/models/ApiKey"
import { Session } from "@/lib/models/Session"
import crypto from "crypto"

function generateApiKey() {
  return `pk_${crypto.randomBytes(24).toString("hex")}`
}

function maskApiKey(key: string) {
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

export async function GET() {
  await connectDB()

  const sessionId = (await cookies()).get("session")?.value
  if (!sessionId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const session = await Session.findById(sessionId)
  if (!session || (session.expiresAt && session.expiresAt < new Date()))
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })

  const apiKeys = await ApiKey.find({ userId: session.userId })

  return NextResponse.json({
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

export async function POST() {
  await connectDB()

  const sessionId = (await cookies()).get("session")?.value
  if (!sessionId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const session = await Session.findById(sessionId)
  if (!session || (session.expiresAt && session.expiresAt < new Date()))
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })

  const key = generateApiKey()

  const apiKey = await ApiKey.create({
    userId: session.userId,
    key,
    maskedKey: maskApiKey(key),
    status: "active",
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
