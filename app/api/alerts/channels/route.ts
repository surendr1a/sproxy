import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { AlertChannel } from "@/lib/models/AlertChannel";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const channels = await AlertChannel.find({ userId: user.id }).sort({ createdAt: -1 });
  return NextResponse.json({
    channels: channels.map((c: any) => ({
      id: c._id.toString(),
      name: c.name,
      webhookUrl: c.webhookUrl,
      subscribedEvents: c.subscribedEvents,
      status: c.status,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, webhookUrl, subscribedEvents, secret } = await req.json();
  if (!name || !webhookUrl) {
    return NextResponse.json({ error: "name and webhookUrl required" }, { status: 400 });
  }

  await connectDB();
  const channel = await AlertChannel.create({
    userId: user.id,
    name,
    webhookUrl,
    subscribedEvents:
      Array.isArray(subscribedEvents) && subscribedEvents.length
        ? subscribedEvents
        : ["proxy.all_failed", "billing.payment_failed"],
    secret: secret || null,
  });

  return NextResponse.json({
    channel: {
      id: channel._id.toString(),
      name: channel.name,
      webhookUrl: channel.webhookUrl,
      subscribedEvents: channel.subscribedEvents,
      status: channel.status,
    },
  });
}
