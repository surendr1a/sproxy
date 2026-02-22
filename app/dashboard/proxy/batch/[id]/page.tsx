"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  ArrowLeft,
  Copy,
  Loader2,
  PauseCircle,
  PlayCircle,
  Save,
  Trash2,
} from "lucide-react";

type ProxyType = "residential" | "datacenter" | "mobile";

type Batch = {
  id: string;
  name: string;
  proxyType: ProxyType;
  country: string;
  status: "active" | "paused";
  totalProxies: number;
  activeProxies: number;
  createdAt: string;
  updatedAt: string;
};

const COUNTRY_OPTIONS = ["Random", "US", "DE", "IN", "GB", "FR", "CA", "SG"];

function formatProxyType(value: ProxyType) {
  if (value === "datacenter") return "Datacenter";
  if (value === "mobile") return "Mobile";
  return "Residential";
}

export default function ProxyBatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [proxyType, setProxyType] = useState<ProxyType>("residential");
  const [country, setCountry] = useState("Random");

  const loadBatch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/batches/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load batch");
      setBatch(data.batch);
      setName(data.batch.name);
      setProxyType(data.batch.proxyType);
      setCountry(data.batch.country);
    } catch (err: any) {
      notifyError("Failed to load batch", err?.message || "Please try again.");
      setBatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadBatch();
  }, [id]);

  const hasChanges = useMemo(() => {
    if (!batch) return false;
    return (
      name.trim() !== batch.name ||
      proxyType !== batch.proxyType ||
      country !== batch.country
    );
  }, [batch, name, proxyType, country]);

  const saveChanges = async () => {
    if (!batch) return;
    if (!name.trim()) {
      notifyError("Batch name required", "Please add a valid name.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), proxyType, country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes");

      setBatch(data.batch);
      setName(data.batch.name);
      setProxyType(data.batch.proxyType);
      setCountry(data.batch.country);
      notifySuccess("Batch updated", "Configuration saved successfully.");
    } catch (err: any) {
      notifyError("Update failed", err?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!batch) return;

    setToggling(true);
    try {
      const res = await fetch(`/api/proxy/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleStatus" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setBatch(data.batch);
      notifySuccess(
        data.batch.status === "active" ? "Batch resumed" : "Batch paused",
        `${data.batch.name} is now ${data.batch.status}.`
      );
    } catch (err: any) {
      notifyError("Status update failed", err?.message || "Please try again.");
    } finally {
      setToggling(false);
    }
  };

  const deleteBatch = async () => {
    if (!batch) return;
    if (!confirm(`Delete batch \"${batch.name}\" permanently?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/batches/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete batch");

      notifySuccess("Batch deleted", `${batch.name} removed.`);
      router.push("/dashboard/proxy/batch");
    } catch (err: any) {
      notifyError("Delete failed", err?.message || "Please try again.");
      setDeleting(false);
    }
  };

  const copyId = async () => {
    if (!batch) return;
    await navigator.clipboard.writeText(batch.id);
    notifySuccess("Copied", "Batch ID copied to clipboard.");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading batch...
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-sm text-destructive">Batch not found or inaccessible.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/proxy/batch">Go back</Link>
        </Button>
      </div>
    );
  }

  const utilization = batch.totalProxies > 0
    ? Math.round((batch.activeProxies / batch.totalProxies) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button variant="ghost" className="mb-2 px-0" asChild>
            <Link href="/dashboard/proxy/batch">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to batches
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{batch.name}</h1>
          <p className="text-muted-foreground">
            {formatProxyType(batch.proxyType)} proxies in {batch.country}
          </p>
        </div>
        <Badge
          variant={batch.status === "active" ? "default" : "secondary"}
          className={batch.status === "active" ? "bg-emerald-600" : ""}
        >
          {batch.status}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Proxies</p>
            <p className="mt-1 text-xl font-semibold">{batch.totalProxies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Active Proxies</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600">{batch.activeProxies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Utilization</p>
            <p className="mt-1 text-xl font-semibold">{utilization}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="mt-1 text-sm font-semibold">{new Date(batch.updatedAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Configuration</CardTitle>
          <CardDescription>
            Update naming and routing metadata used by your applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="batch-name">Batch Name</Label>
              <Input
                id="batch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Proxy Type</Label>
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
            <div className="space-y-2">
              <Label>Batch ID</Label>
              <div className="flex gap-2">
                <Input value={batch.id} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveChanges} disabled={!hasChanges || saving || deleting || toggling}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={toggleStatus} disabled={toggling || deleting || saving}>
              {toggling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : batch.status === "active" ? (
                <PauseCircle className="mr-2 h-4 w-4" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              {batch.status === "active" ? "Pause Batch" : "Resume Batch"}
            </Button>
            <Button variant="destructive" onClick={deleteBatch} disabled={deleting || saving || toggling}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Batch
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Batch lifecycle and audit timestamps.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="mt-1 font-medium">{new Date(batch.createdAt).toLocaleString()}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="mt-1 font-medium">{new Date(batch.updatedAt).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
