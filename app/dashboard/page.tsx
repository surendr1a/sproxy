"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, AlertTriangle, ArrowRight, Key, BarChart3 } from "lucide-react"

interface DashboardData {
  user: {
    email: string
    planId: string | null
    trialRequestsRemaining: number
    planExpiresAt: string | null
    createdAt: string
  }
  usage: {
    today: number
    thisMonth: number
    failed: number
    remaining: number
  }
  currentPlan: {
    name: string
    monthlyRequestLimit: number
  } | null
}

interface ApiKey {
  id: string
  maskedKey: string
  key: string
  status: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [apiKey, setApiKey] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/api-keys").then((res) => res.json()),
    ])
      .then(([userData, keysData]) => {
        if (userData.user) {
          setData(userData)
        }
        if (keysData.apiKeys?.[0]) {
          setApiKey(keysData.apiKeys[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const copyApiKey = async () => {
    if (apiKey?.key) {
      await navigator.clipboard.writeText(apiKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    )
  }

  const isTrialExpired = !data.user.planId && data.user.trialRequestsRemaining <= 0
  // const isNearLimit = data.usage.remaining > 0 && data.usage.remaining <= 10
  const isNearLimit = 4; // For testing purposes

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to ProxyAPI</p>
      </div>

      {/* Trial Expired Warning */}
      {isTrialExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Trial Expired</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Your free trial has ended. Upgrade to continue using the API.</span>
            <Link href="/dashboard/billing">
              <Button size="sm" variant="outline" className="ml-4 bg-transparent">
                Upgrade Now
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Near Limit Warning */}
      {isNearLimit && !isTrialExpired && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Approaching Limit</AlertTitle>
          <AlertDescription>
            {/* You have {data.usage.remaining} requests remaining. Consider upgrading your plan. */}
            You have requests remaining. Consider upgrading your plan.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* API Key Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-4 w-4" />
              API Key
            </CardTitle>
            <CardDescription>Your primary API key</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                {apiKey?.maskedKey || "No key found"}
              </code>
              <Button size="icon" variant="outline" onClick={copyApiKey} disabled={!apiKey}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Link href="/dashboard/api-keys" className="mt-4 inline-block">
              <Button variant="link" className="h-auto p-0 text-sm">
                Manage keys
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Usage Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-4 w-4" />
              Usage Summary
            </CardTitle>
            <CardDescription>Your request statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                {/* <span className="font-medium">{data.usage.today} requests</span> */}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This month</span>
                {/* <span className="font-medium">{data.usage.thisMonth} requests</span> */}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                {/* <span className="font-medium text-destructive-foreground">{data.usage.failed}</span> */}
              </div>
            </div>
            <Link href="/dashboard/usage" className="mt-4 inline-block">
              <Button variant="link" className="h-auto p-0 text-sm">
                View details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Plan Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge variant={data.user.planId ? "default" : "secondary"}>
                  {data.currentPlan?.name || "Free Trial"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="font-medium">
                  {data.user.planId
                    ? `${data.usage.remaining} / ${data.currentPlan?.monthlyRequestLimit}`
                    : `${data.user.trialRequestsRemaining} / 50`}
                </span>
              </div>
              {data.user.planExpiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Renews</span>
                  <span className="text-sm">
                    {new Date(data.user.planExpiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <Link href="/dashboard/billing" className="mt-4 inline-block">
              <Button variant="link" className="h-auto p-0 text-sm">
                {data.user.planId ? "Manage plan" : "Upgrade"}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/dashboard/how-to-use">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">How to Use</h3>
                <p className="text-sm text-muted-foreground">
                  Learn how to integrate the API
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/dashboard/support">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Check FAQs or contact support
                </p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
