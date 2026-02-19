"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProxyBatch = {
  id: string;
  name: string;
  totalProxies: number;
  activeProxies: number;
  proxyType: "residential" | "datacenter" | "mobile";
  country: string;
  status: "active" | "paused";
  createdAt: string;
};

export default function ProxyBatchPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<ProxyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchName, setBatchName] = useState("");
  const [proxyType, setProxyType] =
    useState<"residential" | "datacenter" | "mobile">("residential");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async () => {
    try {
      const res = await fetch("/api/proxy/batches");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load batches");
      setBatches(data.batches || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const createBatch = async () => {
    if (!batchName.trim()) return;

    const res = await fetch("/api/proxy/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: batchName, proxyType, country }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create batch");
      return;
    }

    setBatchName("");
    setBatches((prev) => [data.batch, ...prev]);
  };

  const toggleStatus = async (id: string) => {
    const res = await fetch(`/api/proxy/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleStatus" }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed to update batch");
    setBatches((prev) => prev.map((b) => (b.id === id ? data.batch : b)));
  };

  const deleteBatch = async (id: string) => {
    if (!confirm("This will permanently delete the batch. Continue?")) return;
    const res = await fetch(`/api/proxy/batches/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setBatches((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) {
    return <div className="p-8">Loading batches...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Proxy Batches</h1>
        <p className="text-gray-500 mt-1">
          Organize and manage your proxy campaigns by use-case and region.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">Create New Proxy Batch</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Batch name"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />
          <select
            value={proxyType}
            onChange={(e) =>
              setProxyType(e.target.value as "residential" | "datacenter" | "mobile")
            }
            className="border rounded-lg px-4 py-2"
          >
            <option value="residential">Residential</option>
            <option value="datacenter">Datacenter</option>
            <option value="mobile">Mobile</option>
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="US">United States</option>
            <option value="DE">Germany</option>
            <option value="IN">India</option>
            <option value="GB">United Kingdom</option>
            <option value="Random">Random</option>
          </select>
          <button
            onClick={createBatch}
            className="bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Create Batch
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4">Batch</th>
              <th className="px-6 py-4">Proxies</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Country</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No proxy batches created yet
                </td>
              </tr>
            )}
            {batches.map((batch) => (
              <tr key={batch.id} className="border-t hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium">{batch.name}</td>
                <td className="px-6 py-4 text-sm">
                  {batch.activeProxies} / {batch.totalProxies}
                </td>
                <td className="px-6 py-4 capitalize">{batch.proxyType}</td>
                <td className="px-6 py-4">{batch.country}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      batch.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {batch.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(batch.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => router.push(`/dashboard/proxy/batch/${batch.id}`)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    View
                  </button>
                  <button
                    onClick={() => toggleStatus(batch.id)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {batch.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => deleteBatch(batch.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
