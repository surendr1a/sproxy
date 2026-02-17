"use client";

import { useState } from "react";

type HeaderItem = {
  key: string;
  value: string;
};

type ApiResponse = {
  success: boolean;
  status?: number;
  body?: any;
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
};

export default function ProxyDashboardPage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { key: "User-Agent", value: "Mozilla/5.0" },
  ]);
  const [body, setBody] = useState("");
  const [country, setCountry] = useState("Random");
  const [rotationMode, setRotationMode] =
    useState<"rotate" | "sticky">("rotate");
  const [ttl, setTtl] = useState(600);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] =
    useState<"response" | "proxy" | "usage">("response");

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = url.startsWith("http");

  /* ---------------- SEND REQUEST ---------------- */

  const handleSendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    // headers array → object
    const headersObject: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key) headersObject[h.key] = h.value;
    });

    try {
      const res = await fetch("/api/proxy/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // API key backend se auth hota hai
          Authorization: "Bearer YOUR_API_KEY_HERE",
        },
        body: JSON.stringify({
          url,
          method,
          headers: headersObject,
          body:
            ["POST", "PUT", "PATCH"].includes(method) && body
              ? body
              : undefined,
          rotationMode,
          ttl,
          country,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Request failed");
      }

      setResponse(data);
      setActiveTab("response");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-7xl mx-auto p-6 flex gap-6">
      <div className="flex-1 space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Proxy Gateway</h1>
            <p className="text-sm text-muted-foreground">
              Send real HTTP requests via global rotating or sticky proxies
            </p>
          </div>
        </div>

        {/* REQUEST BUILDER */}
        <div className="bg-card border rounded-lg p-5 space-y-5">
          <h2 className="font-semibold">Request Builder</h2>

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/api"
            className="w-full border rounded px-3 py-2"
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {["GET", "POST", "PUT", "DELETE"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          {(method === "POST" || method === "PUT") && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 font-mono"
              placeholder='{"key":"value"}'
            />
          )}
        </div>

        {/* PROXY SETTINGS */}
        <div className="bg-card border rounded-lg p-5 space-y-5">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {["Random", "US", "UK", "DE", "IN"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div className="flex gap-6">
            <label>
              <input
                type="radio"
                checked={rotationMode === "rotate"}
                onChange={() => setRotationMode("rotate")}
              />{" "}
              Rotate
            </label>
            <label>
              <input
                type="radio"
                checked={rotationMode === "sticky"}
                onChange={() => setRotationMode("sticky")}
              />{" "}
              Sticky
            </label>
          </div>

          {rotationMode === "sticky" && (
            <input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          )}

          <button
            disabled={!isValidUrl || loading}
            onClick={handleSendRequest}
            className="w-full bg-black text-white py-2 rounded"
          >
            {loading ? "Sending..." : "Send Request via Proxy"}
          </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* RESPONSE TABS */}
        {response && (
          <div className="bg-card border rounded-lg p-5">
            <div className="flex gap-6 border-b pb-2 text-sm">
              {["response", "proxy", "usage"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={
                    activeTab === tab
                      ? "font-semibold border-b-2 border-black"
                      : "text-muted-foreground"
                  }
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mt-4 text-sm">
              {activeTab === "response" && (
                <pre className="bg-muted p-4 rounded overflow-auto">
                  {JSON.stringify(response.body, null, 2)}
                </pre>
              )}

              {activeTab === "proxy" && response.proxy && (
                <ul>
                  <li>IP: {response.proxy.ip}</li>
                  <li>Country: {response.proxy.country}</li>
                  <li>Mode: {response.proxy.mode}</li>
                  <li>Latency: {response.proxy.latencyMs}ms</li>
                </ul>
              )}

              {activeTab === "usage" && response.usage && (
                <ul>
                  <li>Consumed: {response.usage.consumed}</li>
                  <li>Remaining: {response.usage.remaining}</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
