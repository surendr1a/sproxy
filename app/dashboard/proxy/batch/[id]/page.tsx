'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Proxy Batch Detail Page
 * --------------------------------------------------
 * This is the CORE working screen of the SaaS.
 * User manages actual proxies here.
 */

type Proxy = {
  id: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  status: 'alive' | 'dead';
  usageCount: number;
  lastChecked: string;
  enabled: boolean;
};

export default function ProxyBatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  // -------------------------
  // STATIC BATCH INFO
  // -------------------------
  const batch = {
    id,
    name: 'Instagram Automation',
    proxyType: 'Residential',
    country: 'US',
    status: 'Active',
  };

  // -------------------------
  // PROXIES STATE
  // -------------------------
  const [proxies, setProxies] = useState<Proxy[]>([
    {
      id: '1',
      ip: '192.168.1.101',
      port: 8000,
      username: 'user1',
      password: 'pass123',
      status: 'alive',
      usageCount: 124,
      lastChecked: '2026-02-10',
      enabled: true,
    },
    {
      id: '2',
      ip: '192.168.1.102',
      port: 8000,
      username: 'user2',
      password: 'pass456',
      status: 'dead',
      usageCount: 12,
      lastChecked: '2026-02-08',
      enabled: false,
    },
  ]);

  const [showPasswords, setShowPasswords] = useState(false);

  // -------------------------
  // ACTIONS
  // -------------------------
  const toggleProxy = (proxyId: string) => {
    setProxies(prev =>
      prev.map(p =>
        p.id === proxyId ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const removeProxy = (proxyId: string) => {
    if (!confirm('Remove this proxy from batch?')) return;
    setProxies(prev => prev.filter(p => p.id !== proxyId));
  };

  const copyProxy = (proxy: Proxy) => {
    const proxyString = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
    navigator.clipboard.writeText(proxyString);
    alert('Proxy copied to clipboard');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:underline mb-3"
        >
          ← Back to Batches
        </button>

        <h1 className="text-3xl font-bold">{batch.name}</h1>
        <p className="text-gray-500 mt-1">
          {batch.proxyType} proxies • {batch.country} • Status:{' '}
          <span className="font-semibold">{batch.status}</span>
        </p>
      </div>

      {/* ACTION BAR */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Total Proxies: <b>{proxies.length}</b> | Active:{' '}
          <b>{proxies.filter(p => p.enabled).length}</b>
        </div>

        <div className="space-x-3">
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="border px-4 py-2 rounded-lg text-sm"
          >
            {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
          </button>

          <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">
            + Add Proxy
          </button>
        </div>
      </div>

      {/* PROXY TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4">IP</th>
              <th className="px-6 py-4">Port</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Password</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Last Check</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {proxies.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No proxies in this batch
                </td>
              </tr>
            )}

            {proxies.map(proxy => (
              <tr
                key={proxy.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4">{proxy.ip}</td>
                <td className="px-6 py-4">{proxy.port}</td>
                <td className="px-6 py-4">{proxy.username}</td>

                <td className="px-6 py-4 font-mono">
                  {showPasswords ? proxy.password : '••••••'}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      proxy.status === 'alive'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {proxy.status}
                  </span>
                </td>

                <td className="px-6 py-4">{proxy.usageCount}</td>

                <td className="px-6 py-4 text-gray-500">
                  {proxy.lastChecked}
                </td>

                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => copyProxy(proxy)}
                    className="text-blue-600 hover:underline"
                  >
                    Copy
                  </button>

                  <button
                    onClick={() => toggleProxy(proxy.id)}
                    className="text-indigo-600 hover:underline"
                  >
                    {proxy.enabled ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    onClick={() => removeProxy(proxy.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FUTURE NOTE */}
      <div className="mt-6 text-xs text-gray-400">
        Upcoming: Proxy testing, rotation rules, auto-replace dead proxies
      </div>
    </div>
  );
}
