import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { ArrowRight } from "lucide-react"

export default function DocsPage() {
  const endpoint = "https://your-domain.com/api/proxy/fetch"

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Simple guide to understand SProxy, who should use it, and how to use each feature correctly.
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Quick Start (2 Minutes)</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4 text-muted-foreground">
                  Make your first proxied request:
                </p>
                <div className="relative rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto font-mono text-sm">
                    <code>{`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","method":"GET","rotationMode":"rotate","country":"Random"}'`}</code>
                  </pre>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard/how-to-use">
                    <Button className="gap-2">
                      Open Full User Guide
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Audience */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Who This Product Is For</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                SProxy is for developers, automation teams, and scraping teams that send many requests and get blocked or rate-limited from a single IP.
              </p>
              <p className="mt-4 text-muted-foreground">
                Best use-cases:
              </p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li>Web scraping at scale</li>
                <li>SERP and competitor monitoring</li>
                <li>Multi-step automation workflows</li>
                <li>Geo-targeted data collection</li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                If you only make occasional direct requests, you likely do not need this.
              </p>
            </div>
          </section>

          {/* Features */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Core Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Proxy Gateway</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Main API entry point. Send any target URL and get response via proxy.
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Rotation Mode</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Uses different proxies across requests to reduce blocking.
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Sticky Sessions</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Keep same proxy identity for stateful flows (login, carts, multi-step actions).
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">IP Check</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Test outgoing IP, status, and latency before running larger jobs.
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Proxy Batches</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Organize campaigns by country, type, and status.
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Usage and Billing</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Track consumption and upgrade plans when limits are reached.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Authentication */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Authentication</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">API Key (Recommended)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    Include your API key in the Authorization header:
                  </p>
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="font-mono text-sm">
                      <code>Authorization: Bearer pk_your_api_key_here</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Request Body */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Request Body Reference</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto font-mono text-sm">
                    <code>{`{
  "url": "https://example.com",        // required
  "method": "GET",                      // optional, default GET
  "headers": { "User-Agent": "..." },   // optional
  "body": "{}",                         // optional for POST/PUT/PATCH
  "rotationMode": "rotate",             // rotate | sticky
  "ttl": 600,                           // sticky TTL in seconds
  "stickySessionId": "my-session-1",    // optional sticky identity
  "country": "US"                       // optional country or Random
}`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Code Examples */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Code Examples</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">cURL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="overflow-x-auto font-mono text-sm">
                      <code>{`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer pk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","method":"GET","rotationMode":"rotate","country":"Random"}'`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Node.js</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="overflow-x-auto font-mono text-sm">
                      <code>{`const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer pk_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    method: 'GET',
    rotationMode: 'sticky',
    stickySessionId: 'checkout-flow-1',
    ttl: 600,
    country: 'US'
  })
});

const data = await response.json();
console.log(data);`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Python</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="overflow-x-auto font-mono text-sm">
                      <code>{`import requests

response = requests.post(
    '${endpoint}',
    headers={
        'Authorization': 'Bearer pk_your_api_key',
        'Content-Type': 'application/json',
    },
    json={
      'url': 'https://example.com',
      'method': 'GET',
      'rotationMode': 'rotate',
      'country': 'Random'
    }
)

print(response.json())`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Response Format */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Response Format</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4 text-muted-foreground">
                  Successful response:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto font-mono text-sm">
                    <code>{`{
  "success": true,
  "status": 200,
  "body": "...target response body...",
  "proxy": {
    "ip": "x.x.x.x",
    "country": "US",
    "mode": "rotate",
    "latencyMs": 245
  },
  "usage": {
    "consumed": 1,
    "remaining": 123
  }
}`}</code>
                  </pre>
                </div>
                <p className="mt-4 mb-4 text-muted-foreground">
                  In strict mode (default for production), unhealthy proxy pool returns 502. In non-strict mode, API may use direct fallback:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto font-mono text-sm">
                    <code>{`{
  "success": true,
  "warning": "All configured proxies failed. Served via direct fallback request.",
  "proxy": {
    "mode": "direct-fallback"
  }
}`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Error Codes */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Common Errors</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 text-left font-medium">Status</th>
                    <th className="py-3 text-left font-medium">Message</th>
                    <th className="py-3 text-left font-medium">Meaning</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm">
                  <tr className="border-b border-border">
                    <td className="py-3">401</td>
                    <td className="py-3 text-destructive-foreground">Invalid or missing API key</td>
                    <td className="py-3 font-sans text-muted-foreground">Auth header missing or wrong key.</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">400</td>
                    <td className="py-3 text-destructive-foreground">Valid target URL is required</td>
                    <td className="py-3 font-sans text-muted-foreground">`url` is missing or not a valid `http/https` URL.</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">429</td>
                    <td className="py-3 text-destructive-foreground">Rate limit exceeded</td>
                    <td className="py-3 font-sans text-muted-foreground">Too many requests in current window.</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3">502</td>
                    <td className="py-3 text-destructive-foreground">All proxies failed</td>
                    <td className="py-3 font-sans text-muted-foreground">Configured proxies could not connect upstream.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Workflow */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Recommended Workflow for New Users</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
                <p>1. Create API key in `Dashboard → API Keys`.</p>
                <p>2. Verify outgoing identity in `Dashboard → IP Check`.</p>
                <p>3. Send real request in `Dashboard → Proxy Gateway`.</p>
                <p>4. Use sticky mode for stateful tasks and test in `Sticky Sessions`.</p>
                <p>5. Organize workloads in `Proxy Batches`.</p>
                <p>6. Monitor limits in `Usage` and upgrade in `Billing`.</p>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <section className="rounded-lg border border-border bg-muted/30 p-8 text-center">
            <h2 className="mb-4 text-xl font-bold">Ready to start?</h2>
            <p className="mb-6 text-muted-foreground">
              Go to dashboard and run your first live request now.
            </p>
            <Link href="/dashboard/proxy">
              <Button size="lg" className="gap-2">
                Open Proxy Gateway
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
