import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { resolveWorkspaceForUser } from "@/lib/auth/rbac";
import { getSlaMetrics } from "@/lib/sla/getSlaMetrics";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaceId = await resolveWorkspaceForUser(
    authUser.id,
    req.nextUrl.searchParams.get("workspaceId"),
    "viewer"
  );
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
  }

  const days = Math.max(7, Math.min(Number(req.nextUrl.searchParams.get("days") || 30), 90));
  const metrics = await getSlaMetrics(authUser.id, workspaceId, days);

  return NextResponse.json({
    workspaceId,
    metrics,
  });
}
