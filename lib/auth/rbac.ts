import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/lib/models/Workspace";
import { WorkspaceMember } from "@/lib/models/WorkspaceMember";
import { User } from "@/lib/models/User";

const ROLE_ORDER = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
} as const;

export type WorkspaceRole = keyof typeof ROLE_ORDER;

export async function getOrCreateDefaultWorkspace(userId: string) {
  await connectDB();

  let ws = await Workspace.findOne({ ownerUserId: userId });
  if (ws) return ws;

  const user = await User.findById(userId).select("email");
  const baseSlug =
    user?.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9-]/g, "-") ||
    `workspace-${userId.slice(-6)}`;

  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  ws = await Workspace.create({
    ownerUserId: userId,
    name: `${baseSlug} workspace`,
    slug,
  });

  await WorkspaceMember.create({
    workspaceId: ws._id,
    userId,
    role: "owner",
    status: "active",
  });

  return ws;
}

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  minRole: WorkspaceRole
) {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) return null;
  await connectDB();

  const member = await WorkspaceMember.findOne({
    workspaceId,
    userId,
    status: "active",
  }).select("role");

  if (!member) return null;
  const hasAccess =
    ROLE_ORDER[member.role as WorkspaceRole] >= ROLE_ORDER[minRole];
  return hasAccess ? member : null;
}

export async function resolveWorkspaceForUser(
  userId: string,
  requestedWorkspaceId?: string | null,
  minRole: WorkspaceRole = "viewer"
) {
  await connectDB();

  if (requestedWorkspaceId) {
    const member = await requireWorkspaceRole(userId, requestedWorkspaceId, minRole);
    if (!member) return null;
    return requestedWorkspaceId;
  }

  const firstMembership = await WorkspaceMember.findOne({
    userId,
    status: "active",
  })
    .sort({ createdAt: 1 })
    .select("workspaceId role");

  if (firstMembership) {
    const hasAccess =
      ROLE_ORDER[firstMembership.role as WorkspaceRole] >= ROLE_ORDER[minRole];
    return hasAccess ? firstMembership.workspaceId.toString() : null;
  }

  const ws = await getOrCreateDefaultWorkspace(userId);
  return ws._id.toString();
}
