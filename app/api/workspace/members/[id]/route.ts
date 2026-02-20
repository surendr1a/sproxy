import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { WorkspaceMember } from "@/lib/models/WorkspaceMember";
import { requireWorkspaceRole } from "@/lib/auth/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { role } = await req.json();

  await connectDB();
  const member = await WorkspaceMember.findById(id);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const allowed = await requireWorkspaceRole(
    user.id,
    member.workspaceId.toString(),
    "admin"
  );
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  member.role = role || member.role;
  await member.save();
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
  const member = await WorkspaceMember.findById(id);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const allowed = await requireWorkspaceRole(
    user.id,
    member.workspaceId.toString(),
    "admin"
  );
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (member.role === "owner") {
    return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });
  }

  await WorkspaceMember.deleteOne({ _id: id });
  return NextResponse.json({ success: true });
}
