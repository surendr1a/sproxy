import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { requireWorkspaceRole } from "@/lib/auth/rbac";
import { WorkspaceMember } from "@/lib/models/WorkspaceMember";
import { User } from "@/lib/models/User";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const allowed = await requireWorkspaceRole(user.id, workspaceId, "viewer");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const members = await WorkspaceMember.find({ workspaceId })
    .populate("userId", "email")
    .sort({ createdAt: 1 });

  return NextResponse.json({
    members: members.map((m: any) => ({
      id: m._id.toString(),
      userId: m.userId?._id?.toString(),
      email: m.userId?.email || null,
      role: m.role,
      status: m.status,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { workspaceId, email, role = "member" } = await req.json();
  if (!workspaceId || !email) {
    return NextResponse.json(
      { error: "workspaceId and email required" },
      { status: 400 }
    );
  }

  const allowed = await requireWorkspaceRole(user.id, workspaceId, "admin");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const target = await User.findOne({ email });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const member = await WorkspaceMember.findOneAndUpdate(
    { workspaceId, userId: target._id },
    {
      role,
      status: "active",
      invitedByUserId: user.id,
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({
    member: {
      id: member._id.toString(),
      userId: target._id.toString(),
      email: target.email,
      role: member.role,
      status: member.status,
    },
  });
}
