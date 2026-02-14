import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { CheckCircle2 } from "lucide-react"

const plans = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    description: "Try before you commit",
    features: ["50 requests", "Speed limited", "Basic dashboard", "No credit card"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    description: "For small projects",
    features: ["5,000 requests/mo", "Full speed", "Email support", "Usage analytics"],
    cta: "Get Started",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    description: "For growing teams",
    features: ["25,000 requests/mo", "Full speed", "Priority support", "Advanced analytics", "Multiple API keys"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    description: "For large scale operations",
    features: ["100,000 requests/mo", "Full speed", "Dedicated support", "Custom limits", "SLA guarantee"],
    cta: "Contact Sales",
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="mb-4 text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={plan.highlight ? "relative border-primary shadow-lg" : ""}
                >
                  {plan.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/signup" className="w-full">
                      <Button
                        className="w-full"
                        variant={plan.highlight ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="mb-12 text-center text-2xl font-bold">Plan Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 text-left font-medium">Feature</th>
                    <th className="py-4 text-center font-medium">Free</th>
                    <th className="py-4 text-center font-medium">Starter</th>
                    <th className="py-4 text-center font-medium">Pro</th>
                    <th className="py-4 text-center font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-4 text-muted-foreground">Monthly Requests</td>
                    <td className="py-4 text-center">50</td>
                    <td className="py-4 text-center">5,000</td>
                    <td className="py-4 text-center">25,000</td>
                    <td className="py-4 text-center">100,000</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 text-muted-foreground">Speed</td>
                    <td className="py-4 text-center">Limited</td>
                    <td className="py-4 text-center">Full</td>
                    <td className="py-4 text-center">Full</td>
                    <td className="py-4 text-center">Full</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 text-muted-foreground">Support</td>
                    <td className="py-4 text-center">Docs</td>
                    <td className="py-4 text-center">Email</td>
                    <td className="py-4 text-center">Priority</td>
                    <td className="py-4 text-center">Dedicated</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 text-muted-foreground">API Keys</td>
                    <td className="py-4 text-center">1</td>
                    <td className="py-4 text-center">2</td>
                    <td className="py-4 text-center">5</td>
                    <td className="py-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 text-muted-foreground">Overage</td>
                    <td className="py-4 text-center">Blocked</td>
                    <td className="py-4 text-center">Blocked</td>
                    <td className="py-4 text-center">$0.005/req</td>
                    <td className="py-4 text-center">Custom</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
