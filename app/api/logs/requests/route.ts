import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { connectDB } from "@/lib/db";
import { resolveWorkspaceForUser } from "@/lib/auth/rbac";
import { ProxyRequestLog } from "@/lib/models/ProxyRequestLog";

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

  const limit = Math.max(10, Math.min(Number(req.nextUrl.searchParams.get("limit") || 50), 200));
  const search = String(req.nextUrl.searchParams.get("q") || "").trim();
  const status = String(req.nextUrl.searchParams.get("status") || "all");

  const filter: Record<string, unknown> = {
    userId: authUser.id,
    workspaceId,
  };

  if (search) {
    filter.$or = [
      { domain: { $regex: search, $options: "i" } },
      { targetUrl: { $regex: search, $options: "i" } },
      { provider: { $regex: search, $options: "i" } },
    ];
  }

  if (status === "success") filter.success = true;
  if (status === "failed") filter.success = false;

  const logs = await ProxyRequestLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "targetUrl domain method status success error provider proxyMode country latencyMs usedDirectFallback requestHeaders requestBody responsePreview createdAt"
    );

  return NextResponse.json({
    logs: logs.map((item: any) => ({
      id: item._id.toString(),
      targetUrl: item.targetUrl,
      domain: item.domain,
      method: item.method,
      status: item.status,
      success: item.success,
      error: item.error || null,
      provider: item.provider,
      proxyMode: item.proxyMode,
      country: item.country,
      latencyMs: item.latencyMs,
      usedDirectFallback: item.usedDirectFallback,
      requestHeaders: item.requestHeaders || {},
      requestBody: item.requestBody || "",
      responsePreview: item.responsePreview || "",
      createdAt: item.createdAt,
    })),
  });
}
