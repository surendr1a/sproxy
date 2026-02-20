"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AlertChannel = {
  id: string;
  name: string;
  webhookUrl: string;
  status: "active" | "disabled";
};

export default function AlertsPage() {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const load = async () => {
    const res = await fetch("/api/alerts/channels");
    const data = await res.json();
    setChannels(data.channels || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name || !webhookUrl) return;
    await fetch("/api/alerts/channels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, webhookUrl }),
    });
    setName("");
    setWebhookUrl("");
    await load();
  };

  const toggle = async (id: string, status: "active" | "disabled") => {
    await fetch(`/api/alerts/channels/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: status === "active" ? "disabled" : "active" }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts & Webhooks</h1>
        <p className="text-muted-foreground">Receive proxy and billing alerts on your endpoint.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Channel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ops Slack Hook" />
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
          <Button onClick={create}>Create Channel</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {channels.length === 0 && <p className="text-sm text-muted-foreground">No channels configured.</p>}
          {channels.map((c) => (
            <div key={c.id} className="rounded border p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.webhookUrl}</p>
              </div>
              <Button variant="outline" onClick={() => toggle(c.id, c.status)}>
                {c.status === "active" ? "Disable" : "Enable"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
