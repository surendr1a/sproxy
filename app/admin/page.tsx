"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/admin/StatCard";

type AdminOverview = {
  stats: {
    totalUsers: number;
    activeSubscriptions: number;
    configuredProxies: number;
    monthlyRequests: number;
    failedRequests: number;
    mrr: number;
  };
};

export default function AdminDashboard() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const stats = data?.stats;

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json?.stats) {
          setData(null);
          return;
        }
        setData(json);
      })
      .catch(() => setData(null));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard title="Total Users" value={String(stats?.totalUsers ?? 0)} />
        <StatCard title="Active Subs" value={String(stats?.activeSubscriptions ?? 0)} />
        <StatCard title="Configured Proxies" value={String(stats?.configuredProxies ?? 0)} />
        <StatCard title="Monthly Requests" value={String(stats?.monthlyRequests ?? 0)} />
        <StatCard title="Failed Requests" value={String(stats?.failedRequests ?? 0)} />
        <StatCard title="MRR" value={`$${stats?.mrr ?? 0}`} />
      </div>
    </div>
  );
}
