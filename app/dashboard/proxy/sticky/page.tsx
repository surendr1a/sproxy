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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

type TestResult = {
  requestNo: number;
  ip: string;
  proxyIp: string;
  country: string;
  responseTime: number;
  sticky: boolean;
  status: number;
  ok: boolean;
  error?: string;
};

type StickyApiResponse = {
  success: boolean;
  mode: "sticky";
  targetUrl: string;
  sessionId: string;
  country: string;
  requestCount: number;
  delay: number;
  results: TestResult[];
  summary: {
    total: number;
    successCount: number;
    failedCount: number;
    uniqueIps: number;
    stickyPercent: number;
    avgLatencyMs: number;
    baselineIp: string | null;
  };
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

export default function StickySessionTesterPage() {
  const [url, setUrl] = useState(URL_PRESETS[0]);
  const [sessionId, setSessionId] = useState("session_123");
  const [requestCount, setRequestCount] = useState(5);
  const [delay, setDelay] = useState(1000);
  const [country, setCountry] = useState("Random");
  const [running, setRunning] = useState(false);
  const [resultPayload, setResultPayload] = useState<StickyApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!url.trim()) return "Target URL is required.";
    if (!isValidHttpUrl(url.trim())) return "Target URL must be valid HTTP/HTTPS.";
    if (!sessionId.trim()) return "Session ID is required.";
    if (requestCount < 1 || requestCount > 20) return "Request count must be between 1 and 20.";
    if (delay < 0 || delay > 5000) return "Delay must be between 0 and 5000 ms.";
    return null;
  }, [url, sessionId, requestCount, delay]);

  const startTest = async () => {
    if (validationError) {
      notifyError("Invalid configuration", validationError);
      return;
    }

    setRunning(true);
    setResultPayload(null);
    setError(null);
    try {
      const res = await fetch("/api/proxy/sticky-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          sessionId: sessionId.trim(),
          requestCount,
          delay,
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sticky test failed");
      setResultPayload(data);
      notifySuccess("Sticky test completed", "Session consistency metrics are ready.");
    } catch (err: any) {
      const message = err?.message || "Sticky test failed";
      setError(message);
      notifyError("Sticky test failed", message);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setUrl(URL_PRESETS[0]);
    setSessionId("session_123");
    setRequestCount(5);
    setDelay(1000);
    setCountry("Random");
    setResultPayload(null);
    setError(null);
  };

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    notifySuccess("Copied", `${label} copied to clipboard.`);
  };

  const results = resultPayload?.results || [];
  const summary = resultPayload?.summary;
  const stickyWorking = summary ? summary.uniqueIps <= 1 && summary.failedCount === 0 : false;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sticky Session Tester</h1>
          <p className="text-muted-foreground">
            Verify that the same session keeps a stable outgoing IP across multiple requests.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button disabled={running || !!validationError} onClick={startTest}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
            Start Test
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Same `sessionId` should ideally keep one stable IP for all test requests.
          </CardDescription>
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
                <Button key={preset} variant="outline" size="sm" onClick={() => setUrl(preset)}>
                  Use {new URL(preset).hostname}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Session ID</Label>
              <Input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="session_123"
              />
            </div>
            <div className="space-y-2">
              <Label>Request Count</Label>
              <Input
                type="number"
                value={requestCount}
                min={1}
                max={20}
                onChange={(e) => setRequestCount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Delay (ms)</Label>
              <Input
                type="number"
                value={delay}
                min={0}
                max={5000}
                onChange={(e) => setDelay(Number(e.target.value))}
              />
            </div>
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
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {stickyWorking ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-600" />
              )}
              Sticky Summary
            </CardTitle>
            <CardDescription>
              Verdict:{" "}
              <span className={stickyWorking ? "text-emerald-600" : "text-rose-600"}>
                {stickyWorking ? "Sticky working as expected" : "Sticky behavior unstable"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="mt-1 font-semibold">{summary.total}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Successful</p>
                <p className="mt-1 font-semibold">{summary.successCount}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="mt-1 font-semibold">{summary.failedCount}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Unique IPs</p>
                <p className="mt-1 font-semibold">{summary.uniqueIps}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Sticky %</p>
                <p className="mt-1 font-semibold">{summary.stickyPercent}%</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Avg Latency</p>
                <p className="mt-1 font-semibold">{summary.avgLatencyMs} ms</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
              <Badge variant="outline">
                <TimerReset className="mr-1 h-3.5 w-3.5" />
                Session: {resultPayload?.sessionId}
              </Badge>
              <Badge variant="outline">Country: {resultPayload?.country}</Badge>
              {summary.baselineIp && (
                <Badge variant="default">Baseline IP: {summary.baselineIp}</Badge>
              )}
              {summary.baselineIp && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyValue(summary.baselineIp || "", "Baseline IP")}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy Baseline IP
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Requests</CardTitle>
            <CardDescription>
              Each row shows outgoing IP, status, and whether it matched baseline sticky IP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Detected IP</TableHead>
                  <TableHead>Proxy IP</TableHead>
                  <TableHead>Latency (ms)</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Sticky</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.requestNo}>
                    <TableCell>{r.requestNo}</TableCell>
                    <TableCell className="font-mono">{r.ip}</TableCell>
                    <TableCell className="font-mono">{r.proxyIp}</TableCell>
                    <TableCell>{r.responseTime}</TableCell>
                    <TableCell>{r.status || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={r.sticky ? "default" : "destructive"}>
                        {r.sticky ? "MATCH" : "CHANGED"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-72 truncate text-muted-foreground">
                      {r.error || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && summary && (
        <Card className="border-dashed">
          <CardContent className="py-5 text-sm text-muted-foreground">
            {stickyWorking ? (
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sticky routing looks stable. You can use this session mode for stateful flows.
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Sticky routing showed changes. Retry with another country/session or inspect proxy pool health.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
