"use client";

import { useState } from "react";

type TestResult = {
  requestNo: number;
  ip: string;
  country: string;
  responseTime: number;
  sticky: boolean;
  status: number;
};

export default function StickySessionTesterPage() {
  const [url, setUrl] = useState("https://api.ipify.org?format=json");
  const [sessionId, setSessionId] = useState("session_123");
  const [requestCount, setRequestCount] = useState(5);
  const [delay, setDelay] = useState(1000);
  const [country, setCountry] = useState("Random");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startTest = async () => {
    setRunning(true);
    setResults([]);
    setError(null);
    try {
      const res = await fetch("/api/proxy/sticky-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, sessionId, requestCount, delay, country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sticky test failed");
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || "Sticky test failed");
    } finally {
      setRunning(false);
    }
  };

  const uniqueIps = [...new Set(results.map((r) => r.ip))];
  const stickyPercent =
    results.length > 0
      ? Math.round((results.filter((r) => r.sticky).length / results.length) * 100)
      : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sticky Session Tester</h1>
        <p className="text-gray-500 mt-2">
          Verify same session returns stable proxy identity over time.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border rounded-lg px-4 py-2"
            placeholder="Target URL"
          />
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="border rounded-lg px-4 py-2"
            placeholder="Session ID"
          />
          <input
            type="number"
            value={requestCount}
            onChange={(e) => setRequestCount(Number(e.target.value))}
            className="border rounded-lg px-4 py-2"
            placeholder="Request Count"
          />
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="border rounded-lg px-4 py-2"
            placeholder="Delay ms"
          />
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
        </div>
        <div className="mt-6 flex gap-3">
          <button
            disabled={running}
            onClick={startTest}
            className="bg-black text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {running ? "Running Test..." : "Start Test"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-2">Sticky Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Requests</p>
              <p className="font-bold">{results.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Unique IPs</p>
              <p className="font-bold">{uniqueIps.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Sticky %</p>
              <p className="font-bold">{stickyPercent}%</p>
            </div>
            <div>
              <p className="text-gray-500">Verdict</p>
              <p className={`font-bold ${uniqueIps.length === 1 ? "text-green-600" : "text-red-600"}`}>
                {uniqueIps.length === 1 ? "Sticky Working" : "Sticky Unstable"}
              </p>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">IP</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Response (ms)</th>
                <th className="px-5 py-3">HTTP</th>
                <th className="px-5 py-3">Sticky</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.requestNo} className="border-t">
                  <td className="px-5 py-3">{r.requestNo}</td>
                  <td className="px-5 py-3 font-mono">{r.ip}</td>
                  <td className="px-5 py-3">{r.country}</td>
                  <td className="px-5 py-3">{r.responseTime}</td>
                  <td className="px-5 py-3">{r.status || "-"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        r.sticky ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.sticky ? "MATCH" : "CHANGED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
