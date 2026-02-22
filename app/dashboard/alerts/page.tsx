"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/toast";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";

type AlertEventType =
  | "proxy.all_failed"
  | "proxy.direct_fallback"
  | "billing.payment_failed"
  | "billing.subscription_canceled"
  | "system.test";

type AlertChannel = {
  id: string;
  name: string;
  webhookUrl: string;
  subscribedEvents: AlertEventType[];
  status: "active" | "disabled";
};

type DeliveryLog = {
  id: string;
  event: AlertEventType;
  status: "success" | "failed";
  attempts: number;
  responseStatus: number | null;
  error: string | null;
  createdAt: string;
};

const EVENT_LABELS: Record<AlertEventType, string> = {
  "proxy.all_failed": "Proxy - All Failed",
  "proxy.direct_fallback": "Proxy - Direct Fallback",
  "billing.payment_failed": "Billing - Payment Failed",
  "billing.subscription_canceled": "Billing - Subscription Canceled",
  "system.test": "System - Test Alert",
};

export default function AlertsPage() {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [eventOptions, setEventOptions] = useState<AlertEventType[]>([]);
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<AlertEventType[]>([
    "proxy.all_failed",
    "billing.payment_failed",
  ]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const selectedCountText = useMemo(
    () => `${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"} selected`,
    [selectedEvents.length]
  );

  const load = async () => {
    try {
      const [channelsRes, logsRes] = await Promise.all([
        fetch("/api/alerts/channels"),
        fetch("/api/alerts/logs"),
      ]);

      const channelsData = await channelsRes.json();
      const logsData = await logsRes.json();

      if (!channelsRes.ok) {
        throw new Error(channelsData?.error || "Failed to load channels");
      }
      if (!logsRes.ok) {
        throw new Error(logsData?.error || "Failed to load logs");
      }

      setChannels(channelsData.channels || []);
      setEventOptions(channelsData.eventOptions || []);
      setLogs(logsData.logs || []);
    } catch (err: any) {
      notifyError("Alerts failed to load", err?.message || "Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleEvent = (event: AlertEventType) => {
    setSelectedEvents((prev) => {
      if (prev.includes(event)) return prev.filter((e) => e !== event);
      return [...prev, event];
    });
  };

  const create = async () => {
    if (!name.trim() || !webhookUrl.trim()) {
      notifyError("Missing fields", "Name and webhook URL are required.");
      return;
    }
    if (!selectedEvents.length) {
      notifyError("Select events", "Choose at least one event for this channel.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/alerts/channels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          webhookUrl: webhookUrl.trim(),
          secret: secret.trim() || null,
          subscribedEvents: selectedEvents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create channel");

      setName("");
      setWebhookUrl("");
      setSecret("");
      setSelectedEvents(["proxy.all_failed", "billing.payment_failed"]);
      await load();
      notifySuccess("Channel created", "Your alerts channel is ready.");
    } catch (err: any) {
      notifyError("Could not create channel", err?.message || "Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: string, status: "active" | "disabled") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/alerts/channels/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: status === "active" ? "disabled" : "active" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      await load();
      notifyInfo("Channel updated", "Status changed successfully.");
    } catch (err: any) {
      notifyError("Status update failed", err?.message || "Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const sendTest = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send test alert");
      await load();
      notifySuccess("Test sent", "Webhook test alert dispatched.");
    } catch (err: any) {
      notifyError("Test failed", err?.message || "Unable to deliver test alert.");
    } finally {
      setBusyId(null);
    }
  };

  const removeChannel = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/alerts/channels/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete channel");
      await load();
      notifySuccess("Channel deleted", "Alerts channel removed.");
    } catch (err: any) {
      notifyError("Delete failed", err?.message || "Unable to delete channel.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Alerts & Webhooks</h1>
          <p className="text-muted-foreground">
            Get instant proxy/billing incident notifications on your endpoint.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Alert Channel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ops Slack Hook"
            />
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhook"
            />
          </div>
          <Input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Optional secret for x-sproxy-signature"
          />

          <div className="space-y-2">
            <div className="text-sm font-medium">Subscribed events</div>
            <div className="text-xs text-muted-foreground">{selectedCountText}</div>
            <div className="grid gap-2 md:grid-cols-2">
              {(eventOptions.length ? eventOptions : (Object.keys(EVENT_LABELS) as AlertEventType[])).map(
                (event) => (
                  <label key={event} className="flex items-center gap-2 rounded border p-2 text-sm">
                    <Checkbox
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    <span>{EVENT_LABELS[event]}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <Button onClick={create} disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Channel
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {channels.length === 0 && (
            <p className="text-sm text-muted-foreground">No channels configured yet.</p>
          )}
          {channels.map((c) => (
            <div key={c.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground break-all">{c.webhookUrl}</p>
                </div>
                <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.subscribedEvents.map((e) => (
                  <Badge key={`${c.id}-${e}`} variant="outline">
                    {EVENT_LABELS[e] || e}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => toggleStatus(c.id, c.status)}
                  disabled={busyId === c.id}
                >
                  {busyId === c.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {c.status === "active" ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTest(c.id)}
                  disabled={busyId === c.id || c.status !== "active"}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => removeChannel(c.id)}
                  disabled={busyId === c.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Logs (Latest 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No delivery logs yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{EVENT_LABELS[log.event] || log.event}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "success" ? "default" : "destructive"}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.attempts}</TableCell>
                    <TableCell>{log.responseStatus ?? "-"}</TableCell>
                    <TableCell className="max-w-64 truncate">{log.error || "-"}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
