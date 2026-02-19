"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Batch = {
  id: string;
  name: string;
  proxyType: string;
  country: string;
  status: "active" | "paused";
  totalProxies: number;
  activeProxies: number;
  createdAt: string;
  updatedAt: string;
};

export default function ProxyBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const res = await fetch(`/api/proxy/batches/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load batch");
        setBatch(data.batch);
      } catch (err: any) {
        setError(err.message || "Failed to load batch");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadBatch();
  }, [id]);

  const toggleStatus = async () => {
    if (!batch) return;
    const res = await fetch(`/api/proxy/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleStatus" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update batch");
      return;
    }
    setBatch(data.batch);
  };

  if (loading) return <div className="p-8">Loading batch...</div>;
  if (error || !batch) {
    return <div className="p-8 text-red-600">{error || "Batch not found"}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline mb-3">
        ← Back to Batches
      </button>

      <h1 className="text-3xl font-bold">{batch.name}</h1>
      <p className="text-gray-500 mt-1">
        {batch.proxyType} proxies • {batch.country} • Status:{" "}
        <span className="font-semibold">{batch.status}</span>
      </p>

      <div className="bg-white rounded-xl shadow p-6 mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total proxies</p>
            <p className="font-semibold">{batch.totalProxies}</p>
          </div>
          <div>
            <p className="text-gray-500">Active proxies</p>
            <p className="font-semibold">{batch.activeProxies}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-semibold">{new Date(batch.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Last updated</p>
            <p className="font-semibold">{new Date(batch.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={toggleStatus}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm"
          >
            {batch.status === "active" ? "Pause batch" : "Activate batch"}
          </button>
        </div>
      </div>
    </div>
  );
}
