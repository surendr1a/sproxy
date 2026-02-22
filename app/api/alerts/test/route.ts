import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { connectDB } from "@/lib/db";
import { AlertChannel } from "@/lib/models/AlertChannel";
import { AlertDeliveryLog } from "@/lib/models/AlertDeliveryLog";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const reqBody = await req.json().catch(() => ({}));
  const channelId = typeof reqBody?.channelId === "string" ? reqBody.channelId : "";

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  await connectDB();
  const channel = await AlertChannel.findOne({ _id: channelId, userId: user.id }).select(
    "webhookUrl secret status"
  );
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }
  if (channel.status !== "active") {
    return NextResponse.json({ error: "Channel is disabled" }, { status: 400 });
  }

  const payloadBody = JSON.stringify({
    event: "system.test",
    occurredAt: new Date().toISOString(),
    payload: {
      message: "This is a test alert from your dashboard.",
      channelId,
      at: new Date().toISOString(),
    },
  });
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (channel.secret) {
    headers["x-sproxy-signature"] = crypto
      .createHmac("sha256", channel.secret)
      .update(payloadBody)
      .digest("hex");
  }

  let status: "success" | "failed" = "failed";
  let responseStatus: number | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(channel.webhookUrl, { method: "POST", headers, body: payloadBody });
    responseStatus = res.status;
    status = res.ok ? "success" : "failed";
    if (!res.ok) error = `HTTP ${res.status}`;
  } catch (e: any) {
    error = e?.message || "Network error";
  }

  await AlertDeliveryLog.create({
    userId: user.id,
    channelId: channel._id,
    event: "system.test",
    status,
    attempts: 1,
    responseStatus,
    error,
    createdAt: new Date(),
  });

  if (status !== "success") {
    return NextResponse.json(
      { error: error || "Failed to deliver test alert", responseStatus },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, message: "Test alert sent." });
}
