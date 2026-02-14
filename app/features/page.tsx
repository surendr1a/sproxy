import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import {
  RefreshCw,
  Lock,
  Globe,
  Gauge,
  Calendar,
  BarChart3,
  Search,
  Bot,
  LineChart,
  ShieldCheck,
  MapPin,
  Link2,
  ArrowRight,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

function FeaturesPageContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="mb-4 text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
              Everything you need for reliable proxy access
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Simple API, automatic IP rotation, and complete visibility into your usage.
            </p>
          </div>
        </section>

        {/* Core Features */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-2xl font-bold">Core Features</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <CardTitle>Rotating IP Proxy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Every request automatically routes through a different IP address from our
                    global pool. No configuration needed.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5" />
                  </div>
                  <CardTitle>HTTP / HTTPS Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Full support for both HTTP and HTTPS traffic. Works with any HTTP client,
                    library, or framework.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Lock className="h-5 w-5" />
                  </div>
                  <CardTitle>API Key Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Simple Bearer token authentication. Generate keys instantly, revoke anytime,
                    track usage per key.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    Username / Password Auth
                    <Badge variant="secondary">Coming Soon</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Traditional proxy authentication with username and password for legacy
                    integrations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Limits & Controls */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-2xl font-bold">Limits & Controls</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <Gauge className="mb-4 h-8 w-8 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold">Speed Throttling</h3>
                  <p className="text-sm text-muted-foreground">
                    Control request speed to match rate limits of target sites.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Calendar className="mb-4 h-8 w-8 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold">Daily Request Caps</h3>
                  <p className="text-sm text-muted-foreground">
                    Set daily limits to prevent unexpected overages.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <BarChart3 className="mb-4 h-8 w-8 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold">Monthly Usage Limits</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear monthly quotas with alerts before you hit them.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Coming Soon Features */}
        <section className="border-b border-border bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <Badge variant="secondary" className="mb-4">
                Roadmap
              </Badge>
              <h2 className="text-2xl font-bold">Coming Soon</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-dashed">
                <CardContent className="flex items-start gap-4 pt-6">
                  <MapPin className="mt-1 h-6 w-6 text-muted-foreground" />
                  <div>
                    <h3 className="mb-1 font-semibold text-muted-foreground">Geo Targeting</h3>
                    <p className="text-sm text-muted-foreground">
                      Route requests through specific countries or regions.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Link2 className="mt-1 h-6 w-6 text-muted-foreground" />
                  <div>
                    <h3 className="mb-1 font-semibold text-muted-foreground">Sticky Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Maintain the same IP across multiple requests when needed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-2xl font-bold">Use Cases</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Search className="mx-auto mb-4 h-8 w-8" />
                  <h3 className="font-semibold">Web Scraping</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Extract data without getting blocked.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Bot className="mx-auto mb-4 h-8 w-8" />
                  <h3 className="font-semibold">Automation Bots</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Run bots reliably at scale.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <LineChart className="mx-auto mb-4 h-8 w-8" />
                  <h3 className="font-semibold">SEO Tools</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Monitor rankings from different locations.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="mx-auto mb-4 h-8 w-8" />
                  <h3 className="font-semibold">Market Research</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Gather competitive intelligence.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="mb-4 text-balance text-2xl font-bold md:text-3xl">
              Start your free trial today
            </h2>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Get 50 free requests. No credit card required.
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

export default function FeaturesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FeaturesPageContent />
    </Suspense>
  )
}
