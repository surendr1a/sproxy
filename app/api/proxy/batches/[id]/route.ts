import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { ProxyBatch } from "@/lib/models/ProxyBatch";

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: ParamsContext) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  await connectDB();

  const batch = await ProxyBatch.findOne({ _id: id, userId: authUser.id });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({
    batch: {
      id: batch._id.toString(),
      name: batch.name,
      proxyType: batch.proxyType,
      country: batch.country,
      status: batch.status,
      totalProxies: batch.totalProxies,
      activeProxies: batch.activeProxies,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    },
  });
}

export async function PATCH(req: NextRequest, context: ParamsContext) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  await connectDB();

  const batch = await ProxyBatch.findOne({ _id: id, userId: authUser.id });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  if (body?.action === "toggleStatus") {
    batch.status = batch.status === "active" ? "paused" : "active";
  }

  if (typeof body?.name === "string" && body.name.trim()) {
    batch.name = body.name.trim();
  }
  if (typeof body?.country === "string" && body.country.trim()) {
    batch.country = body.country.trim();
  }
  if (["residential", "datacenter", "mobile"].includes(body?.proxyType)) {
    batch.proxyType = body.proxyType;
  }

  await batch.save();

  return NextResponse.json({
    batch: {
      id: batch._id.toString(),
      name: batch.name,
      proxyType: batch.proxyType,
      country: batch.country,
      status: batch.status,
      totalProxies: batch.totalProxies,
      activeProxies: batch.activeProxies,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    },
  });
}

export async function DELETE(_req: NextRequest, context: ParamsContext) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await context.params;
  await connectDB();

  const deleted = await ProxyBatch.findOneAndDelete({ _id: id, userId: authUser.id });
  if (!deleted) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
