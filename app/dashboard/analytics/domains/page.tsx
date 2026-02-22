"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { notifyError } from "@/lib/toast";
import { Loader2, RefreshCw, Search } from "lucide-react";

type DomainMetric = {
  domain: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
};

export default function DomainAnalyticsPage() {
  const [days, setDays] = useState("30");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [domains, setDomains] = useState<DomainMetric[]>([]);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/analytics/domain-success?days=${days}&limit=30`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load analytics");
      setDomains(payload.domains || []);
    } catch (err: any) {
      notifyError("Analytics failed", err?.message || "Please try again.");
      setDomains([]);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [days]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter((item) => item.domain.toLowerCase().includes(q));
  }, [domains, query]);

  const totals = useMemo(() => {
    const total = filtered.reduce((sum, d) => sum + d.total, 0);
    const success = filtered.reduce((sum, d) => sum + d.success, 0);
    const failed = filtered.reduce((sum, d) => sum + d.failed, 0);
    return {
      total,
      success,
      failed,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Per-Domain Success Dashboard</h1>
          <p className="text-muted-foreground">
            Domain-wise reliability, fail ratio and latency hotspots.
          </p>
        </div>
        <Button variant="outline" onClick={() => load(true)} disabled={refreshing || loading}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Adjust time window and search domains.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="days">Time Window (days)</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">Domain Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                className="pl-9"
                placeholder="example.com"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Requests</p><p className="mt-1 text-2xl font-semibold">{totals.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Successful</p><p className="mt-1 text-2xl font-semibold text-emerald-600">{totals.success}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Failed</p><p className="mt-1 text-2xl font-semibold text-rose-600">{totals.failed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Success Rate</p><p className="mt-1 text-2xl font-semibold">{totals.successRate}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domain Table</CardTitle>
          <CardDescription>
            Top {filtered.length} domains in last {days} days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading domain metrics...</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No domain traffic yet.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.domain} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.domain}</p>
                    <p className="text-xs text-muted-foreground">{item.total} requests</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.successRate >= 90 ? "default" : item.successRate >= 70 ? "secondary" : "destructive"}>
                      {item.successRate}% success
                    </Badge>
                    <Badge variant="outline">P95 {item.p95LatencyMs}ms</Badge>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Progress value={item.successRate} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.success} OK / {item.failed} fail</span>
                    <span>avg {item.avgLatencyMs}ms</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
