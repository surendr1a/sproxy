"use client";

import { useState } from "react";

type CheckResult = {
  success: boolean;
  mode?: string;
  status?: number;
  latencyMs?: number;
  proxy?: string;
  body?: string;
  message?: string;
  error?: string;
};

export default function IpCheckPage() {
  const [url, setUrl] = useState("https://api.ipify.org?format=json");
  const [country, setCountry] = useState("Random");
  const [rotationMode, setRotationMode] = useState<"rotate" | "sticky">("rotate");
  const [stickySessionId, setStickySessionId] = useState("session_1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/proxy/ip-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, country, rotationMode, stickySessionId }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IP Check</h1>
        <p className="text-gray-500 mt-1">Validate outgoing proxy IP and latency.</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
          placeholder="https://api.ipify.org?format=json"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option>Random</option>
            <option>US</option>
            <option>DE</option>
            <option>IN</option>
            <option>GB</option>
          </select>

          <select
            value={rotationMode}
            onChange={(e) => setRotationMode(e.target.value as "rotate" | "sticky")}
            className="border rounded-lg px-4 py-2"
          >
            <option value="rotate">Rotate</option>
            <option value="sticky">Sticky</option>
          </select>

          <input
            value={stickySessionId}
            onChange={(e) => setStickySessionId(e.target.value)}
            className="border rounded-lg px-4 py-2"
            placeholder="session id"
            disabled={rotationMode !== "sticky"}
          />
        </div>

        <button
          onClick={runCheck}
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Checking..." : "Run IP Check"}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          {result.success ? (
            <>
              <p><b>Mode:</b> {result.mode}</p>
              <p><b>Status:</b> {result.status}</p>
              <p><b>Proxy IP:</b> {result.proxy}</p>
              <p><b>Latency:</b> {result.latencyMs} ms</p>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-auto">{result.body}</pre>
            </>
          ) : (
            <p className="text-red-600">{result.message || result.error || "Check failed"}</p>
          )}
        </div>
      )}
    </div>
  );
}
