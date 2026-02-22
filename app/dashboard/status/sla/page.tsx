"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { notifyError } from "@/lib/toast";
import { Loader2, RefreshCw } from "lucide-react";

type ProviderSummary = {
  provider: string;
  total: number;
  successRate: number;
  avgLatencyMs: number;
};

type Incident = {
  at: string;
  status: number;
  provider: string;
  latencyMs: number;
};

type SlaMetrics = {
  windowDays: number;
  total: number;
  successCount: number;
  failedCount: number;
  uptimePercent: number;
  p95Latency: number;
  p99Latency: number;
  avgLatency: number;
  errorBudgetRemainingPercent: number;
  providerSummary: ProviderSummary[];
  incidents: Incident[];
};

export default function SlaMetricsPage() {
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<SlaMetrics | null>(null);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/metrics/sla?days=${days}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load SLA metrics");
      setMetrics(payload.metrics || null);
    } catch (err: any) {
      notifyError("SLA metrics failed", err?.message || "Please try again.");
      setMetrics(null);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [days]);

  const uptimeColor = useMemo(() => {
    const uptime = metrics?.uptimePercent || 0;
    if (uptime >= 99) return "bg-emerald-600";
    if (uptime >= 97) return "bg-amber-500";
    return "bg-rose-600";
  }, [metrics]);

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading SLA metrics...</div>;
  }

  if (!metrics) {
    return <p className="text-sm text-muted-foreground">No SLA data available yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">SLA-Style Health Metrics</h1>
          <p className="text-muted-foreground">Uptime, latency percentiles, provider reliability and incidents.</p>
        </div>
        <Button variant="outline" onClick={() => load(true)} disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Window</CardTitle>
          <CardDescription>Evaluate SLA over custom recent duration.</CardDescription>
        </CardHeader>
        <CardContent className="max-w-xs space-y-2">
          <Label>Days</Label>
          <Input type="number" min={7} max={90} value={days} onChange={(e) => setDays(e.target.value)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Uptime</p><p className="mt-1 text-2xl font-semibold">{metrics.uptimePercent}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">P95 Latency</p><p className="mt-1 text-2xl font-semibold">{metrics.p95Latency}ms</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">P99 Latency</p><p className="mt-1 text-2xl font-semibold">{metrics.p99Latency}ms</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Avg Latency</p><p className="mt-1 text-2xl font-semibold">{metrics.avgLatency}ms</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Error Budget Left</p><p className="mt-1 text-2xl font-semibold">{metrics.errorBudgetRemainingPercent}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reliability Score</CardTitle>
          <CardDescription>{metrics.successCount} successful out of {metrics.total} requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={metrics.uptimePercent} className={uptimeColor} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Failed: {metrics.failedCount}</span>
            <span>Success: {metrics.successCount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provider Summary</CardTitle>
            <CardDescription>Compare reliability across providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.providerSummary.map((provider) => (
              <div key={provider.provider} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize">{provider.provider}</p>
                  <Badge variant={provider.successRate >= 95 ? "default" : "secondary"}>{provider.successRate}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {provider.total} requests • avg {provider.avgLatencyMs}ms
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>Latest failed calls in selected window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents recorded.</p>
            ) : (
              metrics.incidents.map((incident, idx) => (
                <div key={`${incident.at}-${idx}`} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{new Date(incident.at).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    Provider: {incident.provider} • Status: {incident.status || "-"} • Latency: {incident.latencyMs}ms
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
