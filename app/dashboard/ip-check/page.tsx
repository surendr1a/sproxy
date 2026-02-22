"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  Activity,
  CheckCircle2,
  Copy,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

type CheckResult = {
  success: boolean;
  mode?: "rotate" | "sticky";
  status?: number;
  ok?: boolean;
  latencyMs?: number;
  proxy?: string;
  targetUrl?: string;
  country?: string;
  stickySessionId?: string | null;
  responseHeaders?: {
    contentType?: string | null;
    server?: string | null;
  };
  bodyPreview?: string;
  bodyJson?: Record<string, unknown> | null;
  body?: string;
  message?: string;
  error?: string;
};

const URL_PRESETS = [
  "https://api.ipify.org?format=json",
  "https://httpbin.org/ip",
  "https://ifconfig.me/all.json",
];

const COUNTRY_OPTIONS = ["Random", "US", "DE", "IN", "GB", "FR", "CA", "SG"];

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function IpCheckPage() {
  const [url, setUrl] = useState(URL_PRESETS[0]);
  const [country, setCountry] = useState("Random");
  const [rotationMode, setRotationMode] = useState<"rotate" | "sticky">("rotate");
  const [stickySessionId, setStickySessionId] = useState("session_1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const validationError = useMemo(() => {
    if (!url.trim()) return "Target URL is required.";
    if (!isValidHttpUrl(url.trim())) return "Target URL must be valid HTTP/HTTPS.";
    if (rotationMode === "sticky" && !stickySessionId.trim()) {
      return "Sticky session id is required in sticky mode.";
    }
    return null;
  }, [url, rotationMode, stickySessionId]);

  const runCheck = async () => {
    if (validationError) {
      notifyError("Invalid input", validationError);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/proxy/ip-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          country,
          rotationMode,
          stickySessionId: stickySessionId.trim(),
        }),
      });
      const data = await res.json();
      setResult(data);
      if (res.ok && data?.success) {
        notifySuccess("IP check completed", "Proxy route and response captured successfully.");
      } else {
        notifyError("IP check failed", data?.error || data?.message || "Request failed.");
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: "IP check failed",
        error: err?.message || "Network error",
      });
      notifyError("IP check failed", err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setUrl(URL_PRESETS[0]);
    setCountry("Random");
    setRotationMode("rotate");
    setStickySessionId("session_1");
    setResult(null);
  };

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    notifySuccess("Copied", `${label} copied to clipboard.`);
  };

  const proxyBody =
    result?.bodyJson && typeof result.bodyJson === "object"
      ? JSON.stringify(result.bodyJson, null, 2)
      : result?.bodyPreview || result?.body || "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">IP Check</h1>
          <p className="text-muted-foreground">
            Validate outgoing IP, route mode, and response health before production jobs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={runCheck} disabled={loading || !!validationError}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
            Run IP Check
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check Settings</CardTitle>
          <CardDescription>Set target URL, geo preference, and routing mode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.ipify.org?format=json"
            />
            <div className="flex flex-wrap gap-2">
              {URL_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setUrl(preset)}
                >
                  Use {new URL(preset).hostname}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rotation Mode</Label>
              <Select
                value={rotationMode}
                onValueChange={(v) => setRotationMode(v as "rotate" | "sticky")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rotate">Rotate</SelectItem>
                  <SelectItem value="sticky">Sticky</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sticky Session ID</Label>
              <Input
                value={stickySessionId}
                onChange={(e) => setStickySessionId(e.target.value)}
                disabled={rotationMode !== "sticky"}
                placeholder="session id"
              />
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                )}
                Check Result
              </CardTitle>
              <CardDescription>
                {result.success
                  ? "Proxy test completed. Review route and response details."
                  : "Proxy test failed. Inspect error and retry with another configuration."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.success ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Mode</p>
                      <p className="mt-1 font-medium uppercase">{result.mode}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="mt-1 font-medium">{result.status}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Latency</p>
                      <p className="mt-1 font-medium">{result.latencyMs} ms</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Country</p>
                      <p className="mt-1 font-medium">{result.country || "Random"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={result.ok ? "default" : "destructive"}>
                        {result.ok ? "HTTP OK" : "HTTP Not OK"}
                      </Badge>
                      {result.stickySessionId && <Badge variant="outline">Sticky: {result.stickySessionId}</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Proxy IP:</span>{" "}
                        <span className="font-medium">{result.proxy || "-"}</span>
                      </p>
                      {result.proxy && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyText(result.proxy || "", "Proxy IP")}
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Copy IP
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground break-all">
                      Target: {result.targetUrl || url}
                    </p>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-xs text-muted-foreground">Response Payload</p>
                    <pre className="max-h-80 overflow-auto rounded bg-muted/40 p-3 text-xs leading-relaxed">
                      {proxyBody || "No body returned"}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                  <p className="font-medium text-destructive">{result.message || "Check failed"}</p>
                  <p className="mt-1 text-sm text-muted-foreground break-all">
                    {result.error || "No error details available."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Route Diagnostics</CardTitle>
              <CardDescription>Quick technical details from latest check.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Proxy IP
                </p>
                <p className="mt-1 break-all font-medium">{result.proxy || "-"}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  Latency
                </p>
                <p className="mt-1 font-medium">
                  {typeof result.latencyMs === "number" ? `${result.latencyMs} ms` : "-"}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Content-Type</p>
                <p className="mt-1 break-all font-medium">
                  {result.responseHeaders?.contentType || "-"}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Server</p>
                <p className="mt-1 break-all font-medium">
                  {result.responseHeaders?.server || "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
