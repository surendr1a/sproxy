"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Gauge,
  Globe,
  Key,
  LifeBuoy,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { notifyError, notifySuccess } from "@/lib/toast";

type DashboardData = {
  user: {
    email: string;
    planId: string | null;
    trialRequestsRemaining: number;
    planExpiresAt: string | null;
    createdAt: string;
  };
  usage: {
    today: number;
    thisMonth: number;
    failed: number;
    remaining: number;
    limit: number;
    percentUsed: number;
  };
  currentPlan: {
    name: string;
    monthlyRequestLimit: number;
  } | null;
  requestCredits: {
    totalRemaining: number;
    currentPlanRemaining: number;
    previousCarryoverRemaining: number;
  };
};

type ApiKey = {
  id: string;
  maskedKey: string;
  key: string;
  status: "active" | "disabled";
  createdAt?: string;
  lastUsedAt?: string;
};

type ProxyStatusData = {
  strictProxyMode: boolean;
  provider: string;
  health: {
    total: number;
    healthyCount: number;
    badCount: number;
  };
};

function formatPlanName(planId: string | null, currentPlanName?: string | null) {
  if (currentPlanName) return currentPlanName;
  if (!planId) return "Free Trial";
  return planId.charAt(0).toUpperCase() + planId.slice(1);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [proxyStatus, setProxyStatus] = useState<ProxyStatusData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyBusy, setKeyBusy] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [meRes, keysRes, statusRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/api-keys", { cache: "no-store" }),
        fetch("/api/proxy/status", { cache: "no-store" }),
      ]);

      const [meData, keysData, statusData] = await Promise.all([
        meRes.json().catch(() => null),
        keysRes.json().catch(() => null),
        statusRes.json().catch(() => null),
      ]);

      if (!meRes.ok || !meData?.user) {
        throw new Error(meData?.error || "Failed to load dashboard");
      }

      setData(meData);
      const activeKey = (keysData?.apiKeys || []).find((k: ApiKey) => k.status === "active" && k.key);
      setApiKey(activeKey || null);
      if (statusRes.ok && statusData?.health) {
        setProxyStatus(statusData);
      } else {
        setProxyStatus(null);
      }
    } catch (err: any) {
      notifyError("Dashboard load failed", err?.message || "Please refresh and try again.");
      setData(null);
      setApiKey(null);
      setProxyStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const copyApiKey = async () => {
    if (!apiKey?.key) return;
    await navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    notifySuccess("Copied", "API key copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const createApiKey = async () => {
    setKeyBusy(true);
    try {
      const res = await fetch("/api/api-keys", { method: "POST" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create API key");
      if (!payload.apiKey?.key) throw new Error("Missing API key in response");
      setApiKey(payload.apiKey);
      notifySuccess("API key created", "New active key generated for your requests.");
    } catch (err: any) {
      notifyError("API key creation failed", err?.message || "Please try again.");
    } finally {
      setKeyBusy(false);
    }
  };

  const computed = useMemo(() => {
    if (!data) return null;

    const isTrial = !data.user.planId;
    const isTrialExpired = isTrial && data.user.trialRequestsRemaining <= 0;
    const remaining = data.usage.remaining;
    const limit = data.usage.limit;
    const lowThreshold = Math.max(10, Math.floor(limit * 0.1));
    const isNearLimit = remaining > 0 && remaining <= lowThreshold;
    const failRate = data.usage.thisMonth > 0
      ? Math.round((data.usage.failed / data.usage.thisMonth) * 100)
      : 0;

    const health = proxyStatus?.health;
    const healthPercent = health?.total
      ? Math.round((health.healthyCount / health.total) * 100)
      : 0;

    return {
      isTrial,
      isTrialExpired,
      isNearLimit,
      failRate,
      healthPercent,
      planName: formatPlanName(data.user.planId, data.currentPlan?.name || null),
      usagePercent: data.usage.percentUsed,
      accountAgeDays: Math.max(
        0,
        Math.floor((Date.now() - new Date(data.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      ),
    };
  }, [data, proxyStatus]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-60" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!data || !computed) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <p className="text-muted-foreground">Unable to load dashboard right now.</p>
      </div>
    );
  }

  const onboardingSteps = [
    {
      label: "Active API key",
      done: !!apiKey?.key,
      href: "/dashboard/api-keys",
      cta: apiKey?.key ? "Manage" : "Create",
    },
    {
      label: "Proxy connectivity check",
      done: !!proxyStatus && (proxyStatus.health?.total || 0) > 0,
      href: "/dashboard/ip-check",
      cta: "Run check",
    },
    {
      label: "First live request",
      done: data.usage.thisMonth > 0,
      href: "/dashboard/proxy",
      cta: "Open proxy",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            One-screen control center for plan, request balance, proxy health, and next actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={computed.isTrial ? "secondary" : "default"}>
            {computed.planName}
          </Badge>
          <Button variant="outline" onClick={loadDashboard}>
            <Loader2 className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {computed.isTrialExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Trial expired</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            Your free requests are finished. Upgrade to continue sending proxy requests.
            <Button size="sm" asChild>
              <Link href="/dashboard/billing">Upgrade plan</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!computed.isTrialExpired && computed.isNearLimit && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low request balance</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            You are running low on available requests. Top-up by upgrading your plan.
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/billing">Open billing</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {(proxyStatus?.health?.badCount ?? 0) > 0 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Proxy health warning</AlertTitle>
          <AlertDescription>
            {proxyStatus?.health?.badCount ?? 0} proxies are currently unhealthy. Check IP/Sticky tester before running critical workloads.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Requests Left</p>
            <p className="mt-1 text-2xl font-semibold">{data.requestCredits.totalRemaining.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Current + carryover combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">This Month Usage</p>
            <p className="mt-1 text-2xl font-semibold">{data.usage.thisMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Today: {data.usage.today.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Failed Requests</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">{data.usage.failed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Fail rate: {computed.failRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Proxy Network Health</p>
            <p className="mt-1 text-2xl font-semibold">{computed.healthPercent}%</p>
            <p className="text-xs text-muted-foreground">
              {proxyStatus?.health?.healthyCount ?? 0}/{proxyStatus?.health?.total ?? 0} healthy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Usage & Capacity Overview
            </CardTitle>
            <CardDescription>
              Understand how much of your monthly capacity is consumed and how much carryover is still available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Monthly usage</span>
                <span>{computed.usagePercent}% used</span>
              </div>
              <Progress value={computed.usagePercent} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{data.usage.thisMonth.toLocaleString()} used</span>
                <span>{data.usage.limit.toLocaleString()} effective limit</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Current Plan Balance</p>
                <p className="mt-1 text-lg font-semibold">{data.requestCredits.currentPlanRemaining.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Carryover Balance</p>
                <p className="mt-1 text-lg font-semibold">{data.requestCredits.previousCarryoverRemaining.toLocaleString()}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Account Age</p>
                <p className="mt-1 text-lg font-semibold">{computed.accountAgeDays} days</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/usage">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Open full usage analytics
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage billing
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" /> API Access
            </CardTitle>
            <CardDescription>
              Primary key used for all authenticated proxy requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-all">
              {apiKey?.maskedKey || "No active key"}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyApiKey} disabled={!apiKey?.key}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy key
              </Button>
              <Button size="sm" onClick={createApiKey} disabled={keyBusy}>
                {keyBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                New key
              </Button>
            </div>
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href="/dashboard/api-keys">
                Manage all keys <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Checklist</CardTitle>
            <CardDescription>
              Follow these steps to avoid confusion and go live fast.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {onboardingSteps.map((step) => (
              <div key={step.label} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <p className="text-sm font-medium">{step.label}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={step.href}>{step.cta}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health Snapshot</CardTitle>
            <CardDescription>
              Keep an eye on routing mode and proxy pool status before heavy jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium capitalize">{proxyStatus?.provider || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-muted-foreground">Strict mode</span>
              <Badge variant={proxyStatus?.strictProxyMode ? "default" : "secondary"}>
                {proxyStatus?.strictProxyMode ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-muted-foreground">Healthy / Total</span>
              <span className="font-medium">
                {proxyStatus?.health?.healthyCount ?? 0} / {proxyStatus?.health?.total ?? 0}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" asChild>
                <Link href="/dashboard/status">
                  <Shield className="mr-2 h-4 w-4" />
                  Open status page
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/ip-check">
                  <Globe className="mr-2 h-4 w-4" />
                  Run IP check
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="transition-colors hover:bg-muted/40">
          <Link href="/dashboard/proxy">
            <CardContent className="flex items-center gap-3 py-5">
              <div className="rounded-md bg-primary/10 p-2"><Activity className="h-5 w-5" /></div>
              <div>
                <p className="font-medium">Proxy Gateway</p>
                <p className="text-xs text-muted-foreground">Send live requests</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="transition-colors hover:bg-muted/40">
          <Link href="/dashboard/proxy/sticky">
            <CardContent className="flex items-center gap-3 py-5">
              <div className="rounded-md bg-primary/10 p-2"><Gauge className="h-5 w-5" /></div>
              <div>
                <p className="font-medium">Sticky Tester</p>
                <p className="text-xs text-muted-foreground">Verify session consistency</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="transition-colors hover:bg-muted/40">
          <Link href="/dashboard/proxy/batch">
            <CardContent className="flex items-center gap-3 py-5">
              <div className="rounded-md bg-primary/10 p-2"><Shield className="h-5 w-5" /></div>
              <div>
                <p className="font-medium">Batch Manager</p>
                <p className="text-xs text-muted-foreground">Organize campaigns</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="transition-colors hover:bg-muted/40">
          <Link href="/dashboard/how-to-use">
            <CardContent className="flex items-center gap-3 py-5">
              <div className="rounded-md bg-primary/10 p-2"><LifeBuoy className="h-5 w-5" /></div>
              <div>
                <p className="font-medium">How To Use</p>
                <p className="text-xs text-muted-foreground">Step by step guidance</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
