import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getOrCreateDefaultWorkspace } from "@/lib/auth/rbac";
import { Workspace } from "@/lib/models/Workspace";
import { WorkspaceMember } from "@/lib/models/WorkspaceMember";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const memberships = await WorkspaceMember.find({
    userId: user.id,
    status: "active",
  })
    .populate("workspaceId", "name slug ownerUserId")
    .sort({ createdAt: -1 });

  if (!memberships.length) {
    await getOrCreateDefaultWorkspace(user.id);
    return GET();
  }

  return NextResponse.json({
    workspaces: memberships.map((m: any) => ({
      workspaceId: m.workspaceId?._id?.toString(),
      name: m.workspaceId?.name,
      slug: m.workspaceId?.slug,
      role: m.role,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, slug } = await req.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  await connectDB();
  const workspace = await Workspace.create({
    ownerUserId: user.id,
    name,
    slug,
  });
  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId: user.id,
    role: "owner",
    status: "active",
  });

  return NextResponse.json({
    workspace: {
      workspaceId: workspace._id.toString(),
      name: workspace.name,
      slug: workspace.slug,
      role: "owner",
    },
  });
}
