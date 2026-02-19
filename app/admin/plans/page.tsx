"use client";

import { useEffect, useState } from "react";
import Table from "@/components/admin/Table";

type PlanRow = {
  name: string;
  price: string;
  requests: string;
  activeUsers: number;
};

const columns = [
  { key: "name", label: "Plan Name" },
  { key: "price", label: "Price" },
  { key: "requests", label: "Monthly Requests" },
  { key: "activeUsers", label: "Active Users" },
];

export default function PlansPage() {
  const [rows, setRows] = useState<PlanRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data.plans || []).map((p: any) => ({
          name: p.name,
          price: `$${p.price} / month`,
          requests: p.monthlyRequestLimit?.toLocaleString?.() || String(p.monthlyRequestLimit),
          activeUsers: p.activeSubscriptions || 0,
        }));
        setRows(mapped);
      })
      .catch(() => setRows([]));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Plans</h2>
      <Table columns={columns} data={rows} />
    </div>
  );
}
