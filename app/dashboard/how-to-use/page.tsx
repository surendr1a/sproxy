"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, ExternalLink } from "lucide-react"

interface ApiKey {
  maskedKey: string
  key: string
}

export default function HowToUsePage() {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKeys?.[0]) {
          setApiKey(data.apiKeys[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const copyCode = async (code: string, section: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const displayKey = apiKey?.maskedKey || "pk_your_api_key"
  const actualKey = apiKey?.key || "pk_your_api_key"

  const codeExamples = {
    curl: `curl -X POST https://api.proxyapi.dev/v1/proxy \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`,
    node: `const response = await fetch('https://api.proxyapi.dev/v1/proxy', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${displayKey}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.post(
    'https://api.proxyapi.dev/v1/proxy',
    headers={
        'Authorization': 'Bearer ${displayKey}',
        'Content-Type': 'application/json',
    },
    json={'url': 'https://example.com'}
)

print(response.json())`,
  }

  const actualCodeExamples = {
    curl: codeExamples.curl.replace(displayKey, actualKey),
    node: codeExamples.node.replace(displayKey, actualKey),
    python: codeExamples.python.replace(displayKey, actualKey),
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">How to Use</h1>
        <p className="text-muted-foreground">
          Learn how to integrate the ProxyAPI into your applications
        </p>
      </div>

      {/* Endpoint Info */}
      <Card>
        <CardHeader>
          <CardTitle>Proxy Endpoint</CardTitle>
          <CardDescription>Send your requests to this endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-4 py-3 font-mono text-sm">
              POST https://api.proxyapi.dev/v1/proxy
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyCode("https://api.proxyapi.dev/v1/proxy", "endpoint")}
            >
              {copiedSection === "endpoint" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium">Port</h4>
              <code className="rounded bg-muted px-3 py-1.5 font-mono text-sm">443 (HTTPS)</code>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Protocol</h4>
              <code className="rounded bg-muted px-3 py-1.5 font-mono text-sm">HTTPS</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Key</CardTitle>
          <CardDescription>Use this key to authenticate your requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-4 py-3 font-mono text-sm">
              {displayKey}
            </code>
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyCode(actualKey, "apikey")}
            >
              {copiedSection === "apikey" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>Copy-paste ready code for your favorite language</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>

            <TabsContent value="curl">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
                  <code>{codeExamples.curl}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2"
                  onClick={() => copyCode(actualCodeExamples.curl, "curl")}
                >
                  {copiedSection === "curl" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="node">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
                  <code>{codeExamples.node}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2"
                  onClick={() => copyCode(actualCodeExamples.node, "node")}
                >
                  {copiedSection === "node" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="python">
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
                  <code>{codeExamples.python}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2"
                  onClick={() => copyCode(actualCodeExamples.python, "python")}
                >
                  {copiedSection === "python" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Response Format */}
      <Card>
        <CardHeader>
          <CardTitle>Response Format</CardTitle>
          <CardDescription>What you&apos;ll receive from the API</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
            <code>{`{
  "success": true,
  "proxyIp": "192.168.1.100",
  "targetUrl": "https://example.com",
  "responseTime": 245,
  "statusCode": 200
}`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* External Docs Link */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <h3 className="font-medium">Need more details?</h3>
            <p className="text-sm text-muted-foreground">
              Check out our full API documentation
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/docs" target="_blank" rel="noopener noreferrer">
              View Full Docs
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
