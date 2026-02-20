import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Mail, BookOpen, MessageSquare, ExternalLink } from "lucide-react"

const faqs = [
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
    question: "Can I upgrade or downgrade my plan anytime?",
    answer:
      "Yes! You can change your plan at any time from the Billing page. When upgrading, you'll get immediate access to the higher limits. When downgrading, the change takes effect at the start of your next billing cycle.",
  },
  {
    question: "How does IP rotation work?",
    answer:
      "Every request you make through our API automatically uses a different IP address from our global pool. You don't need to configure anything - it happens automatically with each request.",
  },
  {
    question: "What happens to my API keys if I regenerate them?",
    answer:
      "When you regenerate an API key, the old key is immediately invalidated. Any applications or scripts using the old key will stop working until you update them with the new key.",
  },
  // {
  //   question: "Is there a refund policy?",
  //   answer:
  //     "Yes, we offer a 7-day money-back guarantee on all paid plans. If you're not satisfied with the service, contact our support team within 7 days of your purchase for a full refund.",
  // },
  {
    question: "How do I track my API usage?",
    answer:
      "Visit the Usage page in your dashboard to see detailed statistics including daily and monthly request counts, failed requests, and visual charts of your usage over time.",
  },
  {
    question: "What authentication methods are supported?",
    answer:
      "API access uses Bearer API keys. Dashboard login supports email/password and Google authentication.",
  },
]

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-muted-foreground">Get help and find answers to common questions</p>
      </div>

      {/* Contact Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Email Support</CardTitle>
            <CardDescription>Get help from our team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Send us an email and we&apos;ll respond within 24 hours.
            </p>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <a href="mailto:support@proxyapi.dev">
                support@proxyapi.dev
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Documentation</CardTitle>
            <CardDescription>Learn how to use the API</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Comprehensive guides and API reference.
            </p>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/docs">
                View Docs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">How to Use</CardTitle>
            <CardDescription>Quick start guide</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Code examples and integration guides.
            </p>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/dashboard/how-to-use">
                View Guide
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Response Time Note */}
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-chart-2/20 p-2">
              <Mail className="h-4 w-4 text-chart-2" />
            </div>
            <div>
              <h3 className="font-medium">Support Response Times</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Free Trial: 48-72 hours</li>
                <li>Starter Plan: 24-48 hours</li>
                <li>Pro Plan: 12-24 hours (Priority)</li>
                <li>Enterprise: 4 hours (Dedicated)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
