"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  Activity,
  Filter,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
} from "lucide-react";

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

type ProxyType = ProxyBatch["proxyType"];
type StatusFilter = "all" | ProxyBatch["status"];
type SortBy = "newest" | "oldest" | "name" | "activeFirst";

const COUNTRY_OPTIONS = ["Random", "US", "DE", "IN", "GB", "FR", "CA", "SG"];

function formatProxyType(value: ProxyType) {
  if (value === "datacenter") return "Datacenter";
  if (value === "mobile") return "Mobile";
  return "Residential";
}

export default function ProxyBatchPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<ProxyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const [batchName, setBatchName] = useState("");
  const [proxyType, setProxyType] = useState<ProxyType>("residential");
  const [country, setCountry] = useState("US");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ProxyType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const loadBatches = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/proxy/batches", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load batches");
      setBatches(data.batches || []);
    } catch (err: any) {
      notifyError("Failed to load batches", err?.message || "Please try again.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const createBatch = async () => {
    if (!batchName.trim()) {
      notifyError("Batch name required", "Please enter a batch name.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/proxy/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: batchName, proxyType, country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create batch");

      setBatchName("");
      setBatches((prev) => [data.batch, ...prev]);
      notifySuccess("Batch created", `${data.batch.name} is ready to use.`);
    } catch (err: any) {
      notifyError("Batch creation failed", err?.message || "Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (batch: ProxyBatch) => {
    setPendingActionId(batch.id);
    try {
      const res = await fetch(`/api/proxy/batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleStatus" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update batch");

      setBatches((prev) => prev.map((b) => (b.id === batch.id ? data.batch : b)));
      notifySuccess(
        data.batch.status === "active" ? "Batch resumed" : "Batch paused",
        `${data.batch.name} is now ${data.batch.status}.`
      );
    } catch (err: any) {
      notifyError("Status update failed", err?.message || "Please try again.");
    } finally {
      setPendingActionId(null);
    }
  };

  const deleteBatch = async (batch: ProxyBatch) => {
    if (!confirm(`Delete batch \"${batch.name}\" permanently?`)) return;

    setPendingActionId(batch.id);
    try {
      const res = await fetch(`/api/proxy/batches/${batch.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete batch");

      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
      notifySuccess("Batch deleted", `${batch.name} removed.`);
    } catch (err: any) {
      notifyError("Delete failed", err?.message || "Please try again.");
    } finally {
      setPendingActionId(null);
    }
  };

  const filteredBatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = batches.filter((batch) => {
      const matchesQuery =
        !normalizedQuery ||
        batch.name.toLowerCase().includes(normalizedQuery) ||
        batch.country.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
      const matchesType = typeFilter === "all" || batch.proxyType === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });

    if (sortBy === "name") {
      next.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "oldest") {
      next.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    } else if (sortBy === "activeFirst") {
      next.sort((a, b) => {
        if (a.status === b.status) return +new Date(b.createdAt) - +new Date(a.createdAt);
        return a.status === "active" ? -1 : 1;
      });
    } else {
      next.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }

    return next;
  }, [batches, query, statusFilter, typeFilter, sortBy]);

  const summary = useMemo(() => {
    const totalBatches = batches.length;
    const activeBatches = batches.filter((b) => b.status === "active").length;
    const pausedBatches = totalBatches - activeBatches;
    const totalProxies = batches.reduce((sum, b) => sum + b.totalProxies, 0);
    const activeProxies = batches.reduce((sum, b) => sum + b.activeProxies, 0);
    const utilization = totalProxies > 0 ? Math.round((activeProxies / totalProxies) * 100) : 0;

    return { totalBatches, activeBatches, pausedBatches, totalProxies, activeProxies, utilization };
  }, [batches]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Proxy Batch Manager</h1>
          <p className="text-muted-foreground">
            Create region and type specific proxy groups for campaigns, automations, and rotation flows.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadBatches(true)} disabled={refreshing || loading}>
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Batches</p>
            <p className="mt-1 text-2xl font-semibold">{summary.totalBatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Active Batches</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">{summary.activeBatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Paused Batches</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">{summary.pausedBatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Proxy Inventory</p>
            <p className="mt-1 text-2xl font-semibold">{summary.activeProxies} / {summary.totalProxies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Utilization</p>
            <p className="mt-1 text-2xl font-semibold">{summary.utilization}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Batch</CardTitle>
          <CardDescription>
            Batch names must be unique per account so your automations can target exact pools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="batch-name">Batch name</Label>
              <Input
                id="batch-name"
                placeholder="e.g. Amazon-Price-Tracker-US"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Proxy type</Label>
              <Select value={proxyType} onValueChange={(value) => setProxyType(value as ProxyType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="datacenter">Datacenter</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={createBatch} disabled={creating || !batchName.trim()}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Batch
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter & Explore
          </CardTitle>
          <CardDescription>
            Search by batch name/country and quickly manage status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by batch name or country"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="paused">Paused only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | ProxyType)}>
            <SelectTrigger>
              <SelectValue placeholder="Proxy type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="datacenter">Datacenter</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="activeFirst">Active first</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batch List</CardTitle>
          <CardDescription>
            {filteredBatches.length} result{filteredBatches.length === 1 ? "" : "s"} shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading batches...
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No matching batches found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing filters, or create your first batch above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => {
                    const isPending = pendingActionId === batch.id;
                    return (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{batch.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {batch.id.slice(-8)}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatProxyType(batch.proxyType)}</TableCell>
                        <TableCell>{batch.country}</TableCell>
                        <TableCell>
                          {batch.activeProxies} / {batch.totalProxies}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={batch.status === "active" ? "default" : "secondary"}
                            className={batch.status === "active" ? "bg-emerald-600" : ""}
                          >
                            {batch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(batch.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href={`/dashboard/proxy/batch/${batch.id}`}>Open</Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => toggleStatus(batch)}
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : batch.status === "active" ? (
                                <PauseCircle className="h-4 w-4" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isPending}
                              onClick={() => deleteBatch(batch)}
                            >
                              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="text-sm text-muted-foreground">
            Need advanced routing? Configure per-batch proxy selection in your request payload using batch metadata.
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard/api-docs")}> 
            <Activity className="mr-2 h-4 w-4" />
            Open API Docs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
