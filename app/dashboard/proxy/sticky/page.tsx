'use client';

import { useState } from 'react';

/**
 * Sticky Session Tester
 * ---------------------------------------
 * Advanced paid feature.
 * Used to test if proxy maintains same IP
 * across multiple requests using same session.
 */

type TestResult = {
  requestNo: number;
  ip: string;
  country: string;
  responseTime: number;
  sticky: boolean;
};

export default function StickySessionTesterPage() {
  const [url, setUrl] = useState('https://api.ipify.org');
  const [sessionId, setSessionId] = useState('session_123');
  const [requestCount, setRequestCount] = useState(5);
  const [delay, setDelay] = useState(1000);

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // ------------------------
  // START TEST (STATIC MOCK)
  // ------------------------
  const startTest = async () => {
    setRunning(true);
    setResults([]);

    const baseIP = '103.21.244.10';

    for (let i = 1; i <= requestCount; i++) {
      await new Promise(res => setTimeout(res, delay));

      const isSticky = i === 1 || Math.random() > 0.15;
      const ip = isSticky ? baseIP : `103.21.244.${20 + i}`;

      setResults(prev => [
        ...prev,
        {
          requestNo: i,
          ip,
          country: 'US',
          responseTime: 180 + Math.floor(Math.random() * 40),
          sticky: ip === baseIP,
        },
      ]);
    }

    setRunning(false);
  };

  const resetTest = () => {
    setResults([]);
  };

  // ------------------------
  // SUMMARY
  // ------------------------
  const uniqueIps = [...new Set(results.map(r => r.ip))];
  const stickyPercent =
    results.length > 0
      ? Math.round(
          (results.filter(r => r.sticky).length / results.length) * 100
        )
      : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sticky Session Tester</h1>
        <p className="text-gray-500 mt-2">
          Test whether your proxy keeps the same IP across multiple requests
          using a session.
        </p>
      </div>

      {/* CONFIG */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="font-semibold mb-4">Test Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-gray-600">Target URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="mt-1 w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Session ID</label>
            <input
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              className="mt-1 w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Request Count</label>
            <input
              type="number"
              value={requestCount}
              onChange={e => setRequestCount(Number(e.target.value))}
              className="mt-1 w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Delay Between Requests (ms)
            </label>
            <input
              type="number"
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              className="mt-1 w-full border rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            disabled={running}
            onClick={startTest}
            className="bg-black text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {running ? 'Running Test...' : 'Start Test'}
          </button>

          <button
            onClick={resetTest}
            className="border px-6 py-2 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SUMMARY */}
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
              <p
                className={`font-bold ${
                  uniqueIps.length === 1
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {uniqueIps.length === 1
                  ? 'Sticky Working'
                  : 'Sticky Unstable'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS TABLE */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">IP</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Response (ms)</th>
                <th className="px-5 py-3">Sticky</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.requestNo} className="border-t">
                  <td className="px-5 py-3">{r.requestNo}</td>
                  <td className="px-5 py-3 font-mono">{r.ip}</td>
                  <td className="px-5 py-3">{r.country}</td>
                  <td className="px-5 py-3">{r.responseTime}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        r.sticky
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {r.sticky ? 'MATCH' : 'CHANGED'}
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
