import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { Session } from "@/lib/models/Session"

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (sessionId) {
    await Session.findByIdAndDelete(sessionId)
  }

  cookieStore.delete("session")
  return NextResponse.json({ success: true })
}
