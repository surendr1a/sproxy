import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { ArrowRight, Copy } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          {/* Header */}
          <div className="mb-12">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Learn how to integrate ProxyAPI into your applications.
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Quick Start</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4 text-muted-foreground">
                  Make your first proxied request in seconds:
                </p>
                <div className="relative rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto font-mono text-sm">
                    <code>{`curl -X POST https://api.proxyapi.dev/v1/proxy \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}</code>
                  </pre>
                </div>
                <div className="mt-4">
                  <Link href="/signup">
                    <Button className="gap-2">
                      Get Your API Key
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* What is a Proxy */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">What is a Proxy?</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                A proxy server acts as an intermediary between your application and the target
                website. Instead of connecting directly, your requests go through the proxy,
                which forwards them using a different IP address.
              </p>
              <p className="mt-4 text-muted-foreground">
                This is essential for:
              </p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li>Avoiding IP-based rate limiting and blocks</li>
                <li>Accessing geo-restricted content</li>
                <li>Maintaining anonymity during web scraping</li>
                <li>Running multiple automation tasks simultaneously</li>
              </ul>
            </div>
          </section>

          {/* How Rotation Works */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">How IP Rotation Works</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                ProxyAPI automatically rotates IP addresses on every request. This means each
                request to your target website appears to come from a different location.
              </p>
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded bg-muted px-3 py-1 font-mono text-sm">
                        Request 1
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="rounded bg-primary/10 px-3 py-1 font-mono text-sm">
                        IP: 192.168.1.x
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded bg-muted px-3 py-1 font-mono text-sm">
                        Request 2
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="rounded bg-primary/10 px-3 py-1 font-mono text-sm">
                        IP: 10.0.0.x
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded bg-muted px-3 py-1 font-mono text-sm">
                        Request 3
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="rounded bg-primary/10 px-3 py-1 font-mono text-sm">
                        IP: 172.16.0.x
                      </span>
                    </div>
                  </div>
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

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
                    Username / Password
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-normal">
                      Coming Soon
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Traditional proxy authentication for legacy integrations will be available
                    soon.
                  </p>
                </CardContent>
              </Card>
            </div>
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
                      <code>{`curl -X POST https://api.proxyapi.dev/v1/proxy \\
  -H "Authorization: Bearer pk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}</code>
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
                      <code>{`const response = await fetch('https://api.proxyapi.dev/v1/proxy', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer pk_your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
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
    'https://api.proxyapi.dev/v1/proxy',
    headers={
        'Authorization': 'Bearer pk_your_api_key',
        'Content-Type': 'application/json',
    },
    json={'url': 'https://example.com'}
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
                  Successful responses include the proxy details:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="overflow-x-auto font-mono text-sm">
                    <code>{`{
  "success": true,
  "proxyIp": "192.168.1.100",
  "targetUrl": "https://example.com",
  "responseTime": 245,
  "statusCode": 200
}`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Error Codes */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">Error Codes</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 text-left font-medium">Code</th>
                    <th className="py-3 text-left font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm">
                  <tr className="border-b border-border">
                    <td className="py-3 text-destructive-foreground">INVALID_API_KEY</td>
                    <td className="py-3 font-sans text-muted-foreground">
                      Missing or invalid API key
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-destructive-foreground">TRIAL_EXPIRED</td>
                    <td className="py-3 font-sans text-muted-foreground">
                      Free trial requests exhausted
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-destructive-foreground">LIMIT_REACHED</td>
                    <td className="py-3 font-sans text-muted-foreground">
                      Monthly request limit reached
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-destructive-foreground">MISSING_URL</td>
                    <td className="py-3 font-sans text-muted-foreground">
                      Target URL not provided in request
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-lg border border-border bg-muted/30 p-8 text-center">
            <h2 className="mb-4 text-xl font-bold">Ready to get started?</h2>
            <p className="mb-6 text-muted-foreground">
              Get your API key and start making proxied requests in minutes.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Your API Key
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
