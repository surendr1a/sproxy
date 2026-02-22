"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { notifyError, notifySuccess, notifyWarning } from "@/lib/toast";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Globe,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Send,
  Server,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";

type HeaderItem = {
  id: string;
  key: string;
  value: string;
};

type ApiResponse = {
  success: boolean;
  status?: number;
  body?: string;
  proxy?: {
    ip: string;
    country: string;
    mode: string;
    latencyMs: number;
  };
  usage?: {
    consumed: number;
    remaining: number;
  };
  message?: string;
  warning?: string;
};

type UserApiKey = {
  id: string;
  key: string;
  status: "active" | "disabled";
  createdAt: string;
  lastUsedAt?: string;
};

type ProxyStatusPayload = {
  strictProxyMode: boolean;
  provider: string;
  health: {
    total: number;
    healthyCount: number;
    badCount: number;
    bad: string[];
  };
};

type RecentRequest = {
  id: string;
  url: string;
  method: string;
  status: number;
  mode: string;
  country: string;
  latencyMs: number;
  success: boolean;
  at: string;
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const COUNTRY_OPTIONS = ["Random", "US", "DE", "IN", "GB", "FR", "CA", "SG"];
const URL_PRESETS = [
  "https://api.ipify.org?format=json",
  "https://httpbin.org/get",
  "https://httpbin.org/headers",
  "https://jsonplaceholder.typicode.com/posts/1",
];

function createHeaderRow(partial?: Partial<HeaderItem>): HeaderItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: partial?.key || "",
    value: partial?.value || "",
  };
}

function parseIfJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function ProxyDashboardPage() {
  const [url, setUrl] = useState(URL_PRESETS[0]);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("GET");
  const [headers, setHeaders] = useState<HeaderItem[]>([
    createHeaderRow({ key: "User-Agent", value: "Mozilla/5.0" }),
  ]);
  const [body, setBody] = useState("");
  const [country, setCountry] = useState("Random");
  const [rotationMode, setRotationMode] = useState<"rotate" | "sticky">("rotate");
  const [stickySessionId, setStickySessionId] = useState("session_123");
  const [ttl, setTtl] = useState(600);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"response" | "proxy" | "usage" | "raw">("response");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  const [apiKey, setApiKey] = useState("");
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [statusPayload, setStatusPayload] = useState<ProxyStatusPayload | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const requiresBody = method === "POST" || method === "PUT" || method === "PATCH";

  const validationError = useMemo(() => {
    if (!/^https?:\/\//i.test(url.trim())) {
      return "Target URL must start with http:// or https://";
    }

    if (rotationMode === "sticky") {
      if (!stickySessionId.trim()) return "Sticky session ID is required in sticky mode.";
      if (!Number.isFinite(ttl) || ttl < 60 || ttl > 3600) {
        return "Sticky TTL must be between 60 and 3600 seconds.";
      }
    }

    if (requiresBody && body.trim()) {
      const contentType = headers.find((h) => h.key.toLowerCase() === "content-type")?.value || "";
      const looksJson = body.trim().startsWith("{") || body.trim().startsWith("[");
      if ((contentType.toLowerCase().includes("application/json") || looksJson) && !parseIfJson(body.trim())) {
        return "Body looks like JSON but is invalid. Fix JSON before sending.";
      }
    }

    return null;
  }, [url, rotationMode, stickySessionId, ttl, requiresBody, body, headers]);

  const parsedResponse = useMemo(() => {
    if (!response?.body) return null;
    return parseIfJson(response.body);
  }, [response]);

  const statusHealth = statusPayload?.health;
  const healthPercent = statusHealth?.total
    ? Math.round((statusHealth.healthyCount / statusHealth.total) * 100)
    : 0;

  const fetchProxyStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/proxy/status", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load proxy status");
      setStatusPayload(data);
    } catch (err: any) {
      setStatusPayload(null);
      notifyError("Status unavailable", err?.message || "Could not load proxy health.");
    } finally {
      setStatusLoading(false);
    }
  };

  const loadApiKey = async () => {
    setLoadingApiKey(true);
    setApiKeyError(null);

    try {
      const keysRes = await fetch("/api/api-keys", { cache: "no-store" });
      const keysData = await keysRes.json();

      if (!keysRes.ok) throw new Error(keysData.error || "Failed to load API key");

      const apiKeys: UserApiKey[] = keysData.apiKeys || [];
      const activeKey = apiKeys.find((k) => k.status === "active" && k.key);

      if (activeKey?.key) {
        setApiKey(activeKey.key);
        return;
      }

      const createRes = await fetch("/api/api-keys", { method: "POST" });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create API key");

      if (!createData.apiKey?.key) throw new Error("API key could not be created");
      setApiKey(createData.apiKey.key);
      notifySuccess("API key ready", "A new key was created automatically.");
    } catch (err: any) {
      const message = err?.message || "Failed to load API key";
      setApiKey("");
      setApiKeyError(message);
      notifyError("API key error", message);
    } finally {
      setLoadingApiKey(false);
    }
  };

  useEffect(() => {
    loadApiKey();
    fetchProxyStatus();
  }, []);

  const updateHeader = (id: string, field: "key" | "value", value: string) => {
    setHeaders((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const addHeader = () => {
    setHeaders((prev) => [...prev, createHeaderRow()]);
  };

  const removeHeader = (id: string) => {
    setHeaders((prev) => (prev.length <= 1 ? prev : prev.filter((h) => h.id !== id)));
  };

  const resetForm = () => {
    setUrl(URL_PRESETS[0]);
    setMethod("GET");
    setHeaders([createHeaderRow({ key: "User-Agent", value: "Mozilla/5.0" })]);
    setBody("");
    setCountry("Random");
    setRotationMode("rotate");
    setStickySessionId("session_123");
    setTtl(600);
    setResponse(null);
    setResponseError(null);
  };

  const handleSendRequest = async () => {
    if (!apiKey) {
      setResponseError("Missing API key. Create or activate at least one key.");
      notifyError("Missing API key", "Open API Keys page and activate one key.");
      return;
    }

    if (validationError) {
      setResponseError(validationError);
      notifyError("Invalid request configuration", validationError);
      return;
    }

    setLoading(true);
    setResponseError(null);
    setResponse(null);

    const headersObject: Record<string, string> = {};
    headers.forEach((h) => {
      const key = h.key.trim();
      if (!key) return;
      headersObject[key] = h.value;
    });

    try {
      const res = await fetch("/api/proxy/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: url.trim(),
          method,
          headers: headersObject,
          body: requiresBody && body.trim() ? body : undefined,
          rotationMode,
          ttl,
          country,
          stickySessionId: rotationMode === "sticky" ? stickySessionId.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Proxy request failed");
      }

      const nextResponse = data as ApiResponse;
      setResponse(nextResponse);
      setActiveTab("response");

      const newEntry: RecentRequest = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: url.trim(),
        method,
        status: nextResponse.status || 0,
        mode: nextResponse.proxy?.mode || rotationMode,
        country: nextResponse.proxy?.country || country,
        latencyMs: nextResponse.proxy?.latencyMs || 0,
        success: true,
        at: new Date().toISOString(),
      };
      setRecentRequests((prev) => [newEntry, ...prev].slice(0, 8));

      if (nextResponse.warning) {
        notifyWarning("Served with warning", nextResponse.warning);
      } else {
        notifySuccess("Request successful", `HTTP ${nextResponse.status} in ${nextResponse.proxy?.latencyMs || 0}ms.`);
      }
    } catch (err: any) {
      const message = err?.message || "Request failed";
      setResponseError(message);

      const failedEntry: RecentRequest = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: url.trim(),
        method,
        status: 0,
        mode: rotationMode,
        country,
        latencyMs: 0,
        success: false,
        at: new Date().toISOString(),
      };
      setRecentRequests((prev) => [failedEntry, ...prev].slice(0, 8));

      notifyError("Request failed", message);
    } finally {
      setLoading(false);
    }
  };

  const curlSnippet = useMemo(() => {
    if (!apiKey || !url.trim()) return "";

    const headerLines = headers
      .filter((h) => h.key.trim())
      .map((h) => `-H '${h.key.trim()}: ${h.value}'`)
      .join(" ");

    const payload = {
      url: url.trim(),
      method,
      headers: Object.fromEntries(headers.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value])),
      ...(requiresBody && body.trim() ? { body } : {}),
      rotationMode,
      ttl,
      country,
      ...(rotationMode === "sticky" ? { stickySessionId: stickySessionId.trim() } : {}),
    };

    return `curl -X POST '\${BASE_URL}/api/proxy/fetch' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${apiKey}' ${headerLines} -d '${JSON.stringify(payload)}'`;
  }, [apiKey, url, method, headers, requiresBody, body, rotationMode, ttl, country, stickySessionId]);

  const copyText = async (value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    notifySuccess("Copied", `${label} copied to clipboard.`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Proxy Control Center</h1>
          <p className="text-muted-foreground">
            Build, test, and inspect live proxy requests with clear diagnostics and usage visibility.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProxyStatus} disabled={statusLoading}>
            {statusLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Health
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/api-keys">
              <KeyRound className="mr-2 h-4 w-4" />
              Manage API Keys
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Provider</p>
            <p className="mt-1 text-xl font-semibold capitalize">{statusPayload?.provider || "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Strict Mode</p>
            <p className="mt-1 text-xl font-semibold">
              {statusPayload?.strictProxyMode ? "On" : "Off"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Healthy Proxies</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">
              {statusHealth?.healthyCount ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Unhealthy Proxies</p>
            <p className="mt-1 text-xl font-semibold text-rose-600">
              {statusHealth?.badCount ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Pool Health</p>
            <p className="mt-1 text-xl font-semibold">{healthPercent}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Request Builder
            </CardTitle>
            <CardDescription>
              Configure target, method, headers and proxy strategy before sending.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Target URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/api"
              />
              <div className="flex flex-wrap gap-2">
                {URL_PRESETS.map((preset) => (
                  <Button key={preset} variant="outline" size="sm" onClick={() => setUrl(preset)}>
                    {new URL(preset).hostname}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={(value) => setMethod(value as (typeof METHODS)[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={rotationMode}
                  onValueChange={(value) => setRotationMode(value as "rotate" | "sticky")}
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
                <Label>Sticky TTL (sec)</Label>
                <Input
                  type="number"
                  min={60}
                  max={3600}
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  disabled={rotationMode !== "sticky"}
                />
              </div>
            </div>

            {rotationMode === "sticky" && (
              <div className="space-y-2">
                <Label>Sticky Session ID</Label>
                <Input
                  value={stickySessionId}
                  onChange={(e) => setStickySessionId(e.target.value)}
                  placeholder="session_123"
                  maxLength={80}
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Headers</Label>
                <Button variant="outline" size="sm" onClick={addHeader}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Header
                </Button>
              </div>
              <div className="space-y-2">
                {headers.map((header, idx) => (
                  <div key={header.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      placeholder="Header key"
                      value={header.key}
                      onChange={(e) => updateHeader(header.id, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateHeader(header.id, "value", e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={headers.length <= 1}
                      onClick={() => removeHeader(header.id)}
                      title={`Remove header ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {requiresBody && (
              <div className="space-y-2">
                <Label>Request Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  className="font-mono text-xs"
                  placeholder='{"query":"your value"}'
                />
              </div>
            )}

            {validationError && <p className="text-sm text-destructive">{validationError}</p>}
            {responseError && <p className="text-sm text-destructive">{responseError}</p>}
            {apiKeyError && <p className="text-sm text-destructive">{apiKeyError}</p>}

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={loading || loadingApiKey || !apiKey || !!validationError}
                onClick={handleSendRequest}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send via Proxy
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" />
                Active API Key
              </CardTitle>
              <CardDescription>
                This key is used for requests from this screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingApiKey ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading key...
                </div>
              ) : apiKey ? (
                <>
                  <div className="rounded-md border bg-muted/40 p-2 font-mono text-xs break-all">
                    {apiKey}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyText(apiKey, "API key")}>
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadApiKey}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Reload
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-destructive">No active API key found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/dashboard/ip-check">
                  IP Check
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/dashboard/proxy/sticky">
                  Sticky Session Tester
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/dashboard/proxy/batch">
                  Batch Manager
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/dashboard/usage">
                  Usage Analytics
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4" />1. Configure target URL + method.</p>
              <p className="flex items-start gap-2"><Globe className="mt-0.5 h-4 w-4" />2. Choose country and rotation strategy.</p>
              <p className="flex items-start gap-2"><Route className="mt-0.5 h-4 w-4" />3. Request goes through healthy proxy from pool.</p>
              <p className="flex items-start gap-2"><Server className="mt-0.5 h-4 w-4" />4. Response + latency + usage appear instantly.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Response Inspector</CardTitle>
          <CardDescription>
            Switch views to inspect payload, proxy metadata and usage impact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "response", label: "Parsed Response" },
              { key: "raw", label: "Raw Response" },
              { key: "proxy", label: "Proxy Details" },
              { key: "usage", label: "Usage" },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.key as "response" | "proxy" | "usage" | "raw")}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {!response ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Send a request to see live response diagnostics here.
            </div>
          ) : (
            <>
              {response.warning && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  <ShieldAlert className="mt-0.5 h-4 w-4" />
                  {response.warning}
                </div>
              )}

              {activeTab === "response" && (
                <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/40 p-4 text-xs">
                  {JSON.stringify(parsedResponse ?? response.body ?? {}, null, 2)}
                </pre>
              )}

              {activeTab === "raw" && (
                <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/40 p-4 text-xs whitespace-pre-wrap break-all">
                  {response.body || "No raw body available"}
                </pre>
              )}

              {activeTab === "proxy" && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 font-semibold">{response.status || "-"}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Proxy IP</p>
                    <p className="mt-1 font-semibold">{response.proxy?.ip || "-"}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Mode</p>
                    <p className="mt-1 font-semibold capitalize">{response.proxy?.mode || "-"}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Latency</p>
                    <p className="mt-1 font-semibold">{response.proxy?.latencyMs || 0} ms</p>
                  </div>
                </div>
              )}

              {activeTab === "usage" && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Consumed</p>
                    <p className="mt-1 font-semibold">{response.usage?.consumed ?? 0}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Remaining (rate window)</p>
                    <p className="mt-1 font-semibold">{response.usage?.remaining ?? "-"}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Result</p>
                    <p className="mt-1 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Success
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Attempts</CardTitle>
            <CardDescription>Latest requests from this session for quick debugging.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests sent yet.</p>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium break-all">{item.method} {item.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.at).toLocaleTimeString()} • {item.country} • {item.mode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.success ? "default" : "destructive"} className={item.success ? "bg-emerald-600" : ""}>
                        {item.success ? `HTTP ${item.status}` : "Failed"}
                      </Badge>
                      <Badge variant="outline">{item.latencyMs} ms</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Snippet</CardTitle>
            <CardDescription>
              Use this payload in backend scripts (replace `${'{BASE_URL}'}` with your domain).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="max-h-[320px] overflow-auto rounded-md border bg-muted/40 p-4 text-xs whitespace-pre-wrap break-all">
              {curlSnippet || "Configure URL and API key to generate snippet."}
            </pre>
            <Button
              variant="outline"
              onClick={() => copyText(curlSnippet, "cURL snippet")}
              disabled={!curlSnippet}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Snippet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
