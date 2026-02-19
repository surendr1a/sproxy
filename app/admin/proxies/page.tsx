"use client";

import { useEffect, useState } from "react";
import Table from "@/components/admin/Table";

type ProxyRow = {
  source: string;
  totalConfigured: number;
  status: string;
};

const columns = [
  { key: "source", label: "Source" },
  { key: "totalConfigured", label: "Configured Proxies" },
  { key: "status", label: "Status" },
];

export default function ProxiesPage() {
  const [rows, setRows] = useState<ProxyRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((data) => {
        const proxies = data.proxies || {};
        setRows([
          {
            source: proxies.source || "PROXY_POOL",
            totalConfigured: proxies.totalConfigured || 0,
            status: (proxies.totalConfigured || 0) > 0 ? "Configured" : "Missing",
          },
        ]);
      })
      .catch(() => setRows([]));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Proxies</h2>
      <Table columns={columns} data={rows} />
    </div>
  );
}
