import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import {
  Ban,
  Clock,
  Bot,
  RefreshCw,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Server,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Reliable Rotating Proxy API for Developers
                </h1>
                <p className="text-lg text-muted-foreground md:text-xl">
                  Fast, simple, usage-based proxy access. No setup headaches.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2">
                      Get Free API Key
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/docs">
                    <Button size="lg" variant="outline">
                      View Docs
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    50 free requests
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                    Cancel anytime
                  </span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-lg border border-border bg-muted p-3">
                        <Server className="h-6 w-6" />
                      </div>
                      <span className="text-xs text-muted-foreground">Your App</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-lg border border-primary bg-primary/10 p-3">
                        <RefreshCw className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">ProxyAPI</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-lg border border-border bg-muted p-3">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <span className="text-xs text-muted-foreground">Target Site</span>
                    </div>
                  </div>
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <code className="font-mono text-xs">
                      <span className="text-muted-foreground">$</span> curl https://api.proxyapi.dev/v1/proxy \
                      <br />
                      <span className="text-muted-foreground pl-4">-H</span> &quot;Authorization: Bearer pk_xxx&quot;
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-balance text-2xl font-bold md:text-3xl">
                Why developers struggle with proxies
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <Ban className="h-5 w-5 text-destructive-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold">Websites block your IP</h3>
                  <p className="text-sm text-muted-foreground">
                    Static IPs get flagged and blocked, breaking your scraping jobs.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <Clock className="h-5 w-5 text-destructive-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold">Rate limits break scraping</h3>
                  <p className="text-sm text-muted-foreground">
                    Too many requests from one IP triggers rate limiting.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <Bot className="h-5 w-5 text-destructive-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold">Automation fails randomly</h3>
                  <p className="text-sm text-muted-foreground">
                    Bots and automation scripts fail unpredictably without proxy rotation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-balance text-2xl font-bold md:text-3xl">
                How ProxyAPI fixes it
              </h2>
            </div>
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-chart-2" />
                <div>
                  <h3 className="font-medium">Automatic IP rotation</h3>
                  <p className="text-sm text-muted-foreground">
                    Every request uses a fresh IP address automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-chart-2" />
                <div>
                  <h3 className="font-medium">Simple API-key authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Just add your API key to requests. No complex setup.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-chart-2" />
                <div>
                  <h3 className="font-medium">Predictable usage-based pricing</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay only for what you use. No hidden fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-balance text-2xl font-bold md:text-3xl">
                Built for developers
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">Rotating IPs</h3>
                  <p className="text-sm text-muted-foreground">
                    Fresh IP address on every request for maximum reliability.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">Speed control</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure request throttling to match your needs.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">Usage dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Track requests, monitor limits, and analyze usage.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="mb-4 text-balance text-2xl font-bold md:text-3xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Get your API key in seconds. Start with 50 free requests.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Free API Key
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
