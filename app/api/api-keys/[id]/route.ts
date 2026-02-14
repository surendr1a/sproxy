import { NextRequest, NextResponse } from "next/server"
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB()

  const sessionId = ( await cookies()).get("session")?.value
  if (!sessionId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const session = await Session.findById(sessionId)
  if (!session || (session.expiresAt && session.expiresAt < new Date()))
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })

  const apiKey = await ApiKey.findOne({
    _id: params.id,
    userId: session.userId,
  })

  if (!apiKey)
    return NextResponse.json({ error: "API key not found" }, { status: 404 })

  const body = await request.json()

  if (body.action === "regenerate") {
    const newKey = generateApiKey()

    apiKey.key = newKey
    apiKey.maskedKey = maskApiKey(newKey)
    apiKey.createdAt = new Date()
    await apiKey.save()

    return NextResponse.json({
      apiKey: {
        id: apiKey._id,
        key: apiKey.key,
        maskedKey: apiKey.maskedKey,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
      },
    })
  }

  if (body.status) {
    apiKey.status = body.status
    await apiKey.save()

    return NextResponse.json({
      apiKey: {
        id: apiKey._id,
        maskedKey: apiKey.maskedKey,
        status: apiKey.status,
      },
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
