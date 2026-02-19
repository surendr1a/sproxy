"use client";

import { useEffect, useState } from "react";
import Table from "@/components/admin/Table";

type Row = {
  user: string;
  plan: string;
  used: number;
  failed: number;
  successRate: string;
};

const columns = [
  { key: "user", label: "User" },
  { key: "plan", label: "Plan" },
  { key: "used", label: "Requests" },
  { key: "failed", label: "Failed" },
  { key: "successRate", label: "Success Rate" },
];

export default function UsagePage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data.users || []).map((u: any) => {
          const success = Math.max((u.requests || 0) - (u.failed || 0), 0);
          const rate =
            u.requests > 0 ? `${Math.round((success / u.requests) * 100)}%` : "N/A";
          return {
            user: u.email,
            plan: u.plan,
            used: u.requests || 0,
            failed: u.failed || 0,
            successRate: rate,
          };
        });
        setRows(mapped);
      })
      .catch(() => setRows([]));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Usage</h2>
      <Table columns={columns} data={rows} />
    </div>
  );
}
