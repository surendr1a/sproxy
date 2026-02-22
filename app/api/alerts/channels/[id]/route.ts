import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { AlertChannel } from "@/lib/models/AlertChannel";
import { isValidWebhookUrl, sanitizeAlertEvents } from "@/lib/alerts/config";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const channel = await AlertChannel.findOne({ _id: id, userId: user.id });
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  if (body.status) {
    if (!["active", "disabled"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    channel.status = body.status;
  }
  if (body.subscribedEvents !== undefined) {
    const events = sanitizeAlertEvents(body.subscribedEvents);
    if (!events.length) {
      return NextResponse.json({ error: "At least one valid event is required" }, { status: 400 });
    }
    channel.subscribedEvents = events;
  }
  if (body.secret !== undefined) {
    channel.secret =
      typeof body.secret === "string" && body.secret.trim() ? body.secret.trim() : null;
  }
  if (body.name) channel.name = String(body.name).trim();
  if (body.webhookUrl !== undefined) {
    const valid = isValidWebhookUrl(body.webhookUrl);
    if (!valid.ok) {
      return NextResponse.json({ error: valid.error }, { status: 400 });
    }
    channel.webhookUrl = valid.url;
  }
  await channel.save();

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  await AlertChannel.deleteOne({ _id: id, userId: user.id });
  return NextResponse.json({ success: true });
}
