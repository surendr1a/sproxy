"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { notifyError, notifySuccess } from "@/lib/toast";
import { Copy, Loader2, PlayCircle, RefreshCw, Search } from "lucide-react";

type RequestLog = {
  id: string;
  targetUrl: string;
  domain: string;
  method: string;
  status: number;
  success: boolean;
  error: string | null;
  provider: string;
  proxyMode: string;
  country: string;
  latencyMs: number;
  usedDirectFallback: boolean;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responsePreview: string;
  createdAt: string;
};

export default function RequestLogsPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [selected, setSelected] = useState<RequestLog | null>(null);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "80", status: statusFilter, q: query });
      const res = await fetch(`/api/logs/requests?${params.toString()}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load logs");
      const next = payload.logs || [];
      setLogs(next);
      if (selected) {
        const latestSelected = next.find((item: RequestLog) => item.id === selected.id) || null;
        setSelected(latestSelected);
      }
    } catch (err: any) {
      notifyError("Log load failed", err?.message || "Please try again.");
      setLogs([]);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [query, statusFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((item) => item.success).length;
    const failed = total - success;
    return { total, success, failed };
  }, [logs]);

  const replay = async (logId: string) => {
    try {
      const res = await fetch("/api/logs/requests/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Replay failed");

      localStorage.setItem("proxy.replay.payload", JSON.stringify(payload.replay));
      notifySuccess("Replay payload ready", "Opening Proxy Gateway with this request.");
      window.location.href = "/dashboard/proxy";
    } catch (err: any) {
      notifyError("Replay failed", err?.message || "Please try again.");
    }
  };

  const copyBlock = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    notifySuccess("Copied", `${label} copied to clipboard.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Request Logs + Replay</h1>
          <p className="text-muted-foreground">Debug failed calls, inspect payloads and replay exact requests.</p>
        </div>
        <Button variant="outline" onClick={() => load(true)} disabled={loading || refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total</p><p className="mt-1 text-2xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Success</p><p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.success}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Failed</p><p className="mt-1 text-2xl font-semibold text-rose-600">{stats.failed}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Find logs by URL/domain/provider and status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search URL, domain or provider" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>All</Button>
            <Button variant={statusFilter === "success" ? "default" : "outline"} onClick={() => setStatusFilter("success")}>Success</Button>
            <Button variant={statusFilter === "failed" ? "default" : "outline"} onClick={() => setStatusFilter("failed")}>Failed</Button>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/proxy">Open Proxy Gateway</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Logs</CardTitle>
            <CardDescription>{logs.length} entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading logs...</div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No logs found.</p>
            ) : (
              logs.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-md border p-3 text-left transition ${selected?.id === item.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  onClick={() => setSelected(item)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium break-all">{item.method} {item.domain}</p>
                    <Badge variant={item.success ? "default" : "destructive"} className={item.success ? "bg-emerald-600" : ""}>
                      {item.success ? `HTTP ${item.status}` : "Failed"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>{item.provider}</span>
                    <span>•</span>
                    <span>{item.country}</span>
                    <span>•</span>
                    <span>{item.latencyMs}ms</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Details</CardTitle>
            <CardDescription>Inspect request and replay quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selected ? (
              <p className="text-sm text-muted-foreground">Select a log to inspect details.</p>
            ) : (
              <>
                <div className="rounded-md border p-3 text-xs">
                  <p><b>URL:</b> {selected.targetUrl}</p>
                  <p><b>Provider:</b> {selected.provider}</p>
                  <p><b>Mode:</b> {selected.proxyMode}</p>
                  <p><b>Status:</b> {selected.status || 0}</p>
                  {selected.error && <p className="text-rose-600"><b>Error:</b> {selected.error}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => replay(selected.id)}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Replay in Gateway
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyBlock(JSON.stringify(selected.requestHeaders || {}, null, 2), "Headers")}> <Copy className="mr-2 h-4 w-4" /> Copy headers </Button>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Request body</p>
                  <pre className="max-h-32 overflow-auto rounded-md border bg-muted/40 p-2 text-xs whitespace-pre-wrap break-all">{selected.requestBody || "-"}</pre>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Response preview</p>
                  <pre className="max-h-40 overflow-auto rounded-md border bg-muted/40 p-2 text-xs whitespace-pre-wrap break-all">{selected.responsePreview || "-"}</pre>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
