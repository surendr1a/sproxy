"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notifyError, notifySuccess } from "@/lib/toast";
import { ArrowDown, ArrowUp, Loader2, Save } from "lucide-react";

type ProviderName = "smartproxy" | "oxylabs" | "custom";

type RoutingPayload = {
  config: {
    mode: "auto" | "manual";
    manualProvider: ProviderName | null;
    providerPriority: ProviderName[];
    failoverOnTimeout: boolean;
    failoverOn5xx: boolean;
    maxProviderAttempts: number;
    enabled: boolean;
  };
  providerAvailability: Record<ProviderName, number>;
  activeOrder: ProviderName[];
};

const providerLabels: Record<ProviderName, string> = {
  smartproxy: "Smartproxy",
  oxylabs: "Oxylabs",
  custom: "Custom Pool",
};

export default function ProviderRoutingPage() {
  const [data, setData] = useState<RoutingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/routing/providers", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load routing config");
      setData(payload);
    } catch (err: any) {
      notifyError("Routing load failed", err?.message || "Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/routing/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.config),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to save config");
      setData(payload);
      notifySuccess("Routing updated", "Provider failover settings saved.");
    } catch (err: any) {
      notifyError("Save failed", err?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reorder = (index: number, dir: "up" | "down") => {
    if (!data) return;
    const arr = [...data.config.providerPriority];
    const next = dir === "up" ? index - 1 : index + 1;
    if (next < 0 || next >= arr.length) return;
    [arr[index], arr[next]] = [arr[next], arr[index]];
    setData({ ...data, config: { ...data.config, providerPriority: arr } });
  };

  const disabledProviders = useMemo(() => {
    if (!data) return [];
    return (Object.entries(data.providerAvailability) as Array<[ProviderName, number]>)
      .filter(([, count]) => count <= 0)
      .map(([provider]) => provider);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading provider routing...
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Could not load provider routing.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Provider Failover Routing</h1>
        <p className="text-muted-foreground">
          Auto-switch between Smartproxy, Oxylabs and Custom pools when failures happen.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(Object.entries(data.providerAvailability) as Array<[ProviderName, number]>).map(([provider, count]) => (
          <Card key={provider}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{providerLabels[provider]}</p>
              <p className="mt-1 text-2xl font-semibold">{count}</p>
              <p className="text-xs text-muted-foreground">configured endpoints</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routing Controls</CardTitle>
          <CardDescription>Define failover behavior and provider order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Enable provider failover</p>
              <p className="text-xs text-muted-foreground">If disabled, default runtime provider pool will be used.</p>
            </div>
            <Switch
              checked={data.config.enabled}
              onCheckedChange={(checked) => setData({ ...data, config: { ...data.config, enabled: checked } })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={data.config.mode === "auto" ? "default" : "outline"}
                  onClick={() => setData({ ...data, config: { ...data.config, mode: "auto" } })}
                >
                  Auto Failover
                </Button>
                <Button
                  variant={data.config.mode === "manual" ? "default" : "outline"}
                  onClick={() => setData({ ...data, config: { ...data.config, mode: "manual" } })}
                >
                  Manual First
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Provider Attempts</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={data.config.maxProviderAttempts}
                onChange={(e) =>
                  setData({
                    ...data,
                    config: {
                      ...data.config,
                      maxProviderAttempts: Math.max(1, Math.min(Number(e.target.value) || 1, 6)),
                    },
                  })
                }
              />
            </div>
          </div>

          {data.config.mode === "manual" && (
            <div className="space-y-2">
              <Label>Manual Primary Provider</Label>
              <div className="flex flex-wrap gap-2">
                {(["smartproxy", "oxylabs", "custom"] as ProviderName[]).map((provider) => (
                  <Button
                    key={provider}
                    variant={data.config.manualProvider === provider ? "default" : "outline"}
                    disabled={(data.providerAvailability[provider] || 0) <= 0}
                    onClick={() => setData({ ...data, config: { ...data.config, manualProvider: provider } })}
                  >
                    {providerLabels[provider]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Failover on timeout</p>
                <p className="text-xs text-muted-foreground">Switch provider when request times out.</p>
              </div>
              <Switch
                checked={data.config.failoverOnTimeout}
                onCheckedChange={(checked) => setData({ ...data, config: { ...data.config, failoverOnTimeout: checked } })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Failover on 5xx</p>
                <p className="text-xs text-muted-foreground">Switch provider when upstream gives server errors.</p>
              </div>
              <Switch
                checked={data.config.failoverOn5xx}
                onCheckedChange={(checked) => setData({ ...data, config: { ...data.config, failoverOn5xx: checked } })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Provider Priority</Label>
            <div className="space-y-2">
              {data.config.providerPriority.map((provider, idx) => (
                <div key={provider} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{idx + 1}</Badge>
                    <span className="font-medium">{providerLabels[provider]}</span>
                    {(data.providerAvailability[provider] || 0) <= 0 && (
                      <Badge variant="destructive">No pool</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => reorder(idx, "up")}> <ArrowUp className="h-4 w-4" /> </Button>
                    <Button variant="outline" size="icon" onClick={() => reorder(idx, "down")}> <ArrowDown className="h-4 w-4" /> </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {disabledProviders.length > 0 && (
            <p className="text-xs text-amber-600">
              Providers without configured pool: {disabledProviders.map((p) => providerLabels[p]).join(", ")}
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Active provider order right now: {data.activeOrder.map((p) => providerLabels[p]).join(" -> ") || "None available"}
            </p>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
