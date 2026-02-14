"use client";

import { useState } from "react";

export default function ProxyDashboardPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/proxy/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text);
      }

      setResponse(text);
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔀 Proxy Gateway</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Target URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.ipify.org?format=json"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        onClick={sendRequest}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send via Proxy"}
      </button>

      {response && (
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {response}
        </pre>
      )}

      {error && (
        <div className="text-red-600 text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
