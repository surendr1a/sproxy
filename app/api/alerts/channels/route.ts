import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { AlertChannel } from "@/lib/models/AlertChannel";
import {
  ALERT_EVENT_OPTIONS,
  isValidWebhookUrl,
  sanitizeAlertEvents,
} from "@/lib/alerts/config";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const channels = await AlertChannel.find({ userId: user.id }).sort({ createdAt: -1 });
  return NextResponse.json({
    eventOptions: ALERT_EVENT_OPTIONS,
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

  const validUrl = isValidWebhookUrl(webhookUrl);
  if (!validUrl.ok) {
    return NextResponse.json({ error: validUrl.error }, { status: 400 });
  }
  const events = sanitizeAlertEvents(subscribedEvents);
  const normalizedEvents = events.length
    ? events
    : ([
        "proxy.all_failed",
        "billing.payment_failed",
      ] as const);

  await connectDB();
  const channel = await AlertChannel.create({
    userId: user.id,
    name: String(name).trim(),
    webhookUrl: validUrl.url,
    subscribedEvents: normalizedEvents,
    secret: typeof secret === "string" && secret.trim() ? secret.trim() : null,
  });

  return NextResponse.json({
    channel: {
      id: channel._id.toString(),
      name: channel.name,
      webhookUrl: channel.webhookUrl,
      subscribedEvents: channel.subscribedEvents,
      status: channel.status,
    },
    eventOptions: ALERT_EVENT_OPTIONS,
  });
}
