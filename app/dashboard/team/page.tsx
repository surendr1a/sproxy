"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Workspace = {
  workspaceId: string;
  name: string;
  role: string;
};

type Member = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export default function TeamPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const loadWorkspaces = async () => {
    const res = await fetch("/api/workspace");
    const data = await res.json();
    const ws = data.workspaces || [];
    setWorkspaces(ws);
    if (ws[0]?.workspaceId) setWorkspaceId((prev) => prev || ws[0].workspaceId);
  };

  const loadMembers = async (wsId: string) => {
    if (!wsId) return;
    const res = await fetch(`/api/workspace/members?workspaceId=${wsId}`);
    const data = await res.json();
    setMembers(data.members || []);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    loadMembers(workspaceId);
  }, [workspaceId]);

  const invite = async () => {
    if (!workspaceId || !email) return;
    await fetch("/api/workspace/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, email, role }),
    });
    setEmail("");
    await loadMembers(workspaceId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team & Access</h1>
        <p className="text-muted-foreground">Manage workspace members and roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.workspaceId} value={w.workspaceId}>
                  {w.name} ({w.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">member</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="viewer">viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={invite}>Add Member</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.length === 0 && <p className="text-sm text-muted-foreground">No members found.</p>}
          {members.map((m) => (
            <div key={m.id} className="rounded border p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{m.email || "Unknown user"}</p>
                <p className="text-xs text-muted-foreground">
                  {m.role} • {m.status}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
