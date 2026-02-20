"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatusData = {
  strictProxyMode: boolean;
  provider: string;
  health: { total: number; healthyCount: number; badCount: number };
};

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);

  useEffect(() => {
    fetch("/api/proxy/status")
      .then((res) => res.json())
      .then((payload) => setData(payload))
      .catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proxy Status</h1>
        <p className="text-muted-foreground">Live health visibility for your configured proxy network.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Provider: {data?.provider || "unknown"}</p>
          <p>Strict mode: {data?.strictProxyMode ? "enabled" : "disabled"}</p>
          <p>Total proxies: {data?.health?.total ?? 0}</p>
          <p>Healthy: {data?.health?.healthyCount ?? 0}</p>
          <p>Bad: {data?.health?.badCount ?? 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}
