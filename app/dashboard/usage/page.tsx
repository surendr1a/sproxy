"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/* ---------------- TYPES ---------------- */

interface UsageData {
  summary: {
    today: number
    thisMonth: number
    failed: number
    remaining: number
    limit: number
    percentUsed: number
  }
  daily: {
    date: string
    requests: number
    failed: number
  }[]
  warnings: {
    trialExpired: boolean
    limitReached: boolean
    nearLimit: boolean
  }
}

interface Workspace {
  workspaceId: string
  name: string
  role: string
}

/* ---------------- STATIC FALLBACK ---------------- */

const FALLBACK_USAGE_DATA: UsageData = {
  summary: {
    today: 120,
    thisMonth: 8200,
    failed: 134,
    limit: 10000,
    remaining: 1800,
    percentUsed: 82,
  },
  daily: Array.from({ length: 14 }).map((_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
    requests: Math.floor(400 + Math.random() * 400),
    failed: Math.floor(Math.random() * 40),
  })),
  warnings: {
    trialExpired: false,
    limitReached: false,
    nearLimit: true,
  },
}

/* ---------------- PAGE ---------------- */

export default function UsagePage() {
  const [data, setData] = useState<UsageData>(FALLBACK_USAGE_DATA)
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<"line" | "bar">("bar")
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = useState("")

  const loadUsage = (wsId?: string) =>
    fetch(`/api/usage${wsId ? `?workspaceId=${wsId}` : ""}`)
      .then((res) => res.json())
      .then((usageData) => {
        if (!usageData || !usageData.daily) {
          setData(FALLBACK_USAGE_DATA)
        } else {
          setData(usageData)
        }
      })
      .catch(() => {
        setData(FALLBACK_USAGE_DATA)
      })
      .finally(() => setLoading(false))

  useEffect(() => {
    const load = async () => {
      const wsRes = await fetch("/api/workspace")
      const wsData = await wsRes.json()
      const list = wsData.workspaces || []
      setWorkspaces(list)
      const first = list[0]?.workspaceId || ""
      setWorkspaceId(first)
      if (!first) {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (workspaceId) {
      setLoading(true)
      loadUsage(workspaceId)
    }
  }, [workspaceId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  /* ---------------- SAFE CHART DATA ---------------- */

  const chartData =
    data?.daily?.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      requests: d.requests,
      failed: d.failed,
    })) ?? []

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usage</h1>
        <p className="text-muted-foreground">
          Monitor your API usage and limits
        </p>
      </div>
      <div className="w-72">
        <Select value={workspaceId} onValueChange={setWorkspaceId}>
          <SelectTrigger>
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((w) => (
              <SelectItem key={w.workspaceId} value={w.workspaceId}>
                {w.name} ({w.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* WARNINGS */}
      {data.warnings.trialExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Trial Expired</AlertTitle>
          <AlertDescription>
            Your free trial has ended.
          </AlertDescription>
        </Alert>
      )}

      {/* STATS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Used This Month</CardDescription>
            <CardTitle className="text-3xl">
              {data.summary.thisMonth.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground flex gap-2">
            <TrendingUp className="h-4 w-4" />
            of {data.summary.limit.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="text-3xl">
              {data.summary.remaining.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={100 - data.summary.percentUsed} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl">
              {data.summary.today.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground flex gap-2">
            <Activity className="h-4 w-4" />
            requests
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl">
              {data.summary.failed.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground flex gap-2">
            <TrendingDown className="h-4 w-4" />
            failures
          </CardContent>
        </Card>
      </div>

      {/* CHART */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Request History</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={chartType === "bar" ? "default" : "outline"}
              onClick={() => setChartType("bar")}
            >
              Bar
            </Button>
            <Button
              size="sm"
              variant={chartType === "line" ? "default" : "outline"}
              onClick={() => setChartType("line")}
            >
              Line
            </Button>
          </div>
        </CardHeader>

        <CardContent className="h-[300px]">
          <ChartContainer
            config={{
              requests: { label: "Requests" },
              failed: { label: "Failed" },
            }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="requests" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="requests" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
