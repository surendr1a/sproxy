import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { connectDB } from "@/lib/db";
import { resolveWorkspaceForUser } from "@/lib/auth/rbac";
import { ProxyRequestLog } from "@/lib/models/ProxyRequestLog";

export async function POST(req: NextRequest) {
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

  const { logId } = await req.json().catch(() => ({}));
  if (!logId) {
    return NextResponse.json({ error: "logId is required" }, { status: 400 });
  }

  const log = await ProxyRequestLog.findOne({ _id: logId, userId: authUser.id, workspaceId })
    .select("targetUrl method requestHeaders requestBody proxyMode country");
  if (!log) {
    return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
  }

  return NextResponse.json({
    replay: {
      url: log.targetUrl,
      method: log.method || "GET",
      headers: log.requestHeaders || {},
      body: log.requestBody || "",
      rotationMode: log.proxyMode || "rotate",
      country: log.country || "Random",
    },
  });
}
