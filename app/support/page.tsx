import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { Mail, BookOpen, ArrowRight } from "lucide-react"

const faqs = [
  {
    question: "What is ProxyAPI?",
    answer:
      "ProxyAPI is a rotating proxy service that provides developers with simple API access to a pool of rotating IP addresses. It's designed for web scraping, automation, and any application that needs to make requests from different IP addresses.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "When you sign up, you automatically get 50 free proxy requests. No credit card required. Once you've used all 50 requests, you'll need to upgrade to a paid plan to continue using the service.",
  },
  {
    question: "What happens when I hit my rate limit?",
    answer:
      "If you exceed your current rate/plan limits, API returns HTTP 429 (Rate limit exceeded) and requests are blocked until reset or plan upgrade.",
  },
  {
    question: "How does IP rotation work?",
    answer:
      "Every request you make through our API automatically uses a different IP address from our global pool. You don't need to configure anything - it happens automatically with each request.",
  },
  {
    question: "What authentication methods are supported?",
    answer:
      "API access uses Bearer API keys. Dashboard login supports email/password and Google authentication.",
  },
  // {
  //   question: "Is there a refund policy?",
  //   answer:
  //     "Yes, we offer a 7-day money-back guarantee on all paid plans. If you're not satisfied with the service, contact our support team within 7 days of your purchase for a full refund.",
  // },
]

export default function PublicSupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="mb-4 text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
              How can we help?
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Find answers to common questions or get in touch with our team.
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="border-b border-border py-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-6 w-6" />
                  </div>
                  <CardTitle>Email Support</CardTitle>
                  <CardDescription>Get help from our team</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    Send us an email and we&apos;ll respond within 24 hours.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="mailto:support@proxyapi.dev">
                      support@proxyapi.dev
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle>Documentation</CardTitle>
                  <CardDescription>Learn how to use the API</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    Comprehensive guides and API reference documentation.
                  </p>
                  <Link href="/docs">
                    <Button variant="outline">
                      View Docs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="mb-4 text-xl font-bold">Still have questions?</h2>
            <p className="mb-6 text-muted-foreground">
              Sign up for free and try it yourself, or reach out to our support team.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signup">
                <Button>Get Started Free</Button>
              </Link>
              <Button variant="outline" asChild>
                <a href="mailto:support@proxyapi.dev">Contact Support</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
