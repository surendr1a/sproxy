import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { AlertChannel } from "@/lib/models/AlertChannel";

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

  if (body.status) channel.status = body.status;
  if (body.subscribedEvents) channel.subscribedEvents = body.subscribedEvents;
  if (body.secret !== undefined) channel.secret = body.secret || null;
  if (body.name) channel.name = body.name;
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
