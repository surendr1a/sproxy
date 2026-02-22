"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Copy, Check, RefreshCw, Power, PowerOff, Plus, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ApiKey {
  id: string
  maskedKey: string
  key: string
  status: "active" | "disabled"
  createdAt: string
  lastUsedAt: string | null
}

interface Workspace {
  workspaceId: string
  name: string
  role: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = useState<string>("")

  const fetchApiKeys = async (wsId?: string) => {
    try {
      const query = wsId ? `?workspaceId=${wsId}` : ""
      const res = await fetch(`/api/api-keys${query}`)
      const data = await res.json()
      if (data.apiKeys) {
        setApiKeys(data.apiKeys)
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

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
      fetchApiKeys(workspaceId)
    }
  }, [workspaceId])

  const copyKey = async (id: string, key: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const regenerateKey = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" }),
      })
      if (res.ok) {
        await fetchApiKeys(workspaceId)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const toggleStatus = async (id: string, currentStatus: "active" | "disabled") => {
    setActionLoading(id)
    try {
      const newStatus = currentStatus === "active" ? "disabled" : "active"
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        await fetchApiKeys(workspaceId)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const createNewKey = async () => {
    setActionLoading("new")
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      })
      if (res.ok) {
        await fetchApiKeys(workspaceId)
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for accessing the proxy</p>
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
        <Button onClick={createNewKey} disabled={actionLoading === "new"}>
          {actionLoading === "new" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Create New Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate your API requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No API keys found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                        {apiKey.maskedKey}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={apiKey.status === "active" ? "default" : "secondary"}
                      >
                        {apiKey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {apiKey.lastUsedAt
                        ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyKey(apiKey.id, apiKey.key)}
                          title="Copy key"
                        >
                          {copiedId === apiKey.id ? (
                            <Check className="h-4 w-4 text-chart-2" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Regenerate key"
                              disabled={actionLoading === apiKey.id}
                            >
                              {actionLoading === apiKey.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will invalidate your current key. Any applications using
                                this key will stop working until you update them with the new
                                key.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => regenerateKey(apiKey.id)}>
                                Regenerate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleStatus(apiKey.id, apiKey.status)}
                          title={apiKey.status === "active" ? "Disable key" : "Enable key"}
                          disabled={actionLoading === apiKey.id}
                        >
                          {apiKey.status === "active" ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-6">
          <h3 className="mb-2 font-medium">Important Notes</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Keep your API keys secure and never expose them in client-side code.</li>
            <li>Regenerating a key will immediately invalidate the old key.</li>
            <li>Disabled keys will return authentication errors.</li>
            <li>Maximum 3 keys per user. Creating a new key after that removes your oldest key.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
