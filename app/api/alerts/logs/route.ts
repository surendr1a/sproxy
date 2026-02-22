import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { connectDB } from "@/lib/db";
import { AlertDeliveryLog } from "@/lib/models/AlertDeliveryLog";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const logs = await AlertDeliveryLog.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("event status attempts responseStatus error createdAt");

  return NextResponse.json({
    logs: logs.map((log: any) => ({
      id: log._id.toString(),
      event: log.event,
      status: log.status,
      attempts: log.attempts,
      responseStatus: log.responseStatus,
      error: log.error,
      createdAt: log.createdAt,
    })),
  });
}
