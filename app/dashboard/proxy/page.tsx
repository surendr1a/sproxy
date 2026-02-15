"use client";

import { useState } from "react";

type HeaderItem = {
  key: string;
  value: string;
};

export default function ProxyDashboardPage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { key: "User-Agent", value: "Mozilla/5.0" },
  ]);
  const [body, setBody] = useState("");
  const [country, setCountry] = useState("Random");
  const [rotationMode, setRotationMode] = useState<"rotate" | "sticky">(
    "rotate"
  );
  const [ttl, setTtl] = useState(600);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"response" | "proxy" | "usage">(
    "response"
  );

  // 🔹 Mock response (static for now)
  const mockResponse = `{
  "ip": "154.21.45.19",
  "message": "Request successful via rotating proxy"
}`;

  return (
    <div className="flex gap-6 max-w-7xl mx-auto p-6">
      {/* MAIN */}
      <div className="flex-1 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔀 Proxy Gateway</h1>
            <p className="text-sm text-gray-500">
              Send requests via rotating IPs (production-ready)
            </p>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="text-green-600">🟢 Proxies Online</span>
            <span>🌍 IPs: 124</span>
            <span>⚡ ~900ms</span>
          </div>
        </div>

        {/* REQUEST BUILDER */}
        <div className="bg-white border rounded-lg p-5 space-y-5">
          {/* URL */}
          <div>
            <label className="text-sm font-medium">Target URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/api"
              className="w-full mt-1 border rounded px-3 py-2"
            />
          </div>

          {/* METHOD */}
          <div>
            <label className="text-sm font-medium">HTTP Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2"
            >
              {["GET", "POST", "PUT", "DELETE"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* HEADERS */}
          <div>
            <label className="text-sm font-medium">Headers</label>
            <div className="space-y-2 mt-2">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h.key}
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Header key"
                  />
                  <input
                    value={h.value}
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Header value"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* BODY */}
          {(method === "POST" || method === "PUT") && (
            <div>
              <label className="text-sm font-medium">Request Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="{ }"
                className="w-full mt-1 border rounded px-3 py-2 font-mono text-sm"
                rows={5}
              />
            </div>
          )}
        </div>

        {/* PROXY CONTROLS */}
        <div className="bg-white border rounded-lg p-5 space-y-5">
          {/* COUNTRY */}
          <div>
            <label className="text-sm font-medium">Proxy Location</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2"
            >
              {["Random", "US", "UK", "DE", "IN"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* ROTATION */}
          <div>
            <label className="text-sm font-medium">IP Mode</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={rotationMode === "rotate"}
                  onChange={() => setRotationMode("rotate")}
                />
                Rotate every request
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={rotationMode === "sticky"}
                  onChange={() => setRotationMode("sticky")}
                />
                Sticky IP
              </label>
            </div>
          </div>

          {/* STICKY SETTINGS */}
          {rotationMode === "sticky" && (
            <div>
              <label className="text-sm font-medium">Sticky TTL (seconds)</label>
              <input
                type="number"
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full mt-1 border rounded px-3 py-2"
              />
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => setLoading(true)}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:opacity-90"
          >
            {loading ? "Sending…" : "🚀 Send Request via Proxy"}
          </button>

          <p className="text-xs text-gray-500">
            Counts towards your monthly quota
          </p>
        </div>

        {/* RESPONSE */}
        <div className="bg-white border rounded-lg p-5">
          <div className="flex gap-4 border-b pb-2 text-sm">
            {["response", "proxy", "usage"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`${
                  activeTab === tab
                    ? "font-semibold border-b-2 border-black"
                    : "text-gray-500"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="mt-4 text-sm">
            {activeTab === "response" && (
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {mockResponse}
              </pre>
            )}

            {activeTab === "proxy" && (
              <ul className="space-y-1">
                <li>IP used: 154.xx.xx.19</li>
                <li>Country: US</li>
                <li>Type: Datacenter</li>
                <li>Latency: 812ms</li>
              </ul>
            )}

            {activeTab === "usage" && (
              <ul className="space-y-1">
                <li>Requests used: +1</li>
                <li>Bandwidth: 34 KB</li>
                <li>Remaining quota: 9,965</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="w-72 bg-white border rounded-lg p-5 space-y-4 h-fit sticky top-6">
        <h2 className="font-semibold">Your Plan</h2>
        <div className="text-sm space-y-1">
          <p>Plan: <strong>Pro</strong></p>
          <p>Requests left: 9,965</p>
          <p>Bandwidth left: 3.2 GB</p>
        </div>

        <button className="w-full border rounded py-2 text-sm hover:bg-gray-50">
          Upgrade Plan →
        </button>
      </div>
    </div>
  );
}
