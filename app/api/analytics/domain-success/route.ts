import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { connectDB } from "@/lib/db";
import { ProxyRequestLog } from "@/lib/models/ProxyRequestLog";
import { resolveWorkspaceForUser } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();

  const workspaceId = await resolveWorkspaceForUser(
    authUser.id,
    req.nextUrl.searchParams.get("workspaceId"),
    "viewer"
  );
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  const days = Math.max(1, Math.min(Number(req.nextUrl.searchParams.get("days") || 30), 90));
  const limit = Math.max(5, Math.min(Number(req.nextUrl.searchParams.get("limit") || 20), 50));

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const rows = await ProxyRequestLog.aggregate([
    {
      $match: {
        userId: authUser.id,
        workspaceId,
        createdAt: { $gte: fromDate },
      },
    },
    {
      $group: {
        _id: "$domain",
        total: { $sum: 1 },
        success: {
          $sum: {
            $cond: ["$success", 1, 0],
          },
        },
        failed: {
          $sum: {
            $cond: ["$success", 0, 1],
          },
        },
        avgLatencyMs: { $avg: "$latencyMs" },
        p95Samples: { $push: "$latencyMs" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: limit },
  ]);

  const domains = rows.map((row: any) => {
    const samples = (row.p95Samples || []).filter((v: any) => Number.isFinite(v)).sort((a: number, b: number) => a - b);
    const p95 = samples.length ? samples[Math.max(0, Math.ceil(samples.length * 0.95) - 1)] : 0;
    return {
      domain: row._id,
      total: row.total || 0,
      success: row.success || 0,
      failed: row.failed || 0,
      successRate: row.total > 0 ? Number(((row.success / row.total) * 100).toFixed(1)) : 0,
      avgLatencyMs: Math.round(row.avgLatencyMs || 0),
      p95LatencyMs: Math.round(p95 || 0),
    };
  });

  return NextResponse.json({
    days,
    workspaceId,
    domains,
  });
}
