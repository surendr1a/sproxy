import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { ProxyBatch } from "@/lib/models/ProxyBatch";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();

  const batches = await ProxyBatch.find({ userId: authUser.id }).sort({
    createdAt: -1,
  });

  return NextResponse.json({
    batches: batches.map((b) => ({
      id: b._id.toString(),
      name: b.name,
      proxyType: b.proxyType,
      country: b.country,
      status: b.status,
      totalProxies: b.totalProxies,
      activeProxies: b.activeProxies,
      createdAt: b.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const name = body?.name?.trim();
  const proxyType = body?.proxyType || "residential";
  const country = body?.country || "Random";

  if (!name) {
    return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
  }

  await connectDB();

  try {
    const batch = await ProxyBatch.create({
      userId: authUser.id,
      name,
      proxyType,
      country,
      status: "active",
    });

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
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "Batch name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}
