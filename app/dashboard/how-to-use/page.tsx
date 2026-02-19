"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Copy, ExternalLink } from "lucide-react";

type ApiKey = {
  key: string;
  maskedKey: string;
  status: "active" | "disabled";
};

type MeResponse = {
  user?: {
    email: string;
    planId: string | null;
    trialRequestsRemaining: number;
  };
};

export default function HowToUsePage() {
  const [loading, setLoading] = useState(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<ApiKey | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [trialLeft, setTrialLeft] = useState<number>(0);

  useEffect(() => {
    Promise.all([fetch("/api/api-keys"), fetch("/api/auth/me")])
      .then(async ([keysRes, meRes]) => {
        const keysData = await keysRes.json();
        const meData: MeResponse = await meRes.json();

        const key = (keysData.apiKeys || []).find(
          (k: ApiKey) => k.status === "active" && k.key
        );
        setActiveKey(key || null);
        setUserPlan(meData.user?.planId || null);
        setTrialLeft(meData.user?.trialRequestsRemaining || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyText = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  const endpoint = "https://your-domain.com/api/proxy/fetch";
  const displayKey = activeKey?.maskedKey || "pk_your_api_key";
  const realKey = activeKey?.key || "pk_your_api_key";

  const curlExample = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url":"https://example.com",
    "method":"GET",
    "rotationMode":"rotate",
    "country":"Random"
  }'`;

  const nodeExample = `const res = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${displayKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://example.com",
    method: "GET",
    rotationMode: "sticky",
    stickySessionId: "checkout-bot-1",
    ttl: 600,
    country: "US"
  })
});

const data = await res.json();
console.log(data);`;

  const pythonExample = `import requests

res = requests.post(
    "${endpoint}",
    headers={
        "Authorization": "Bearer ${displayKey}",
        "Content-Type": "application/json"
    },
    json={
        "url": "https://example.com",
        "method": "GET",
        "rotationMode": "rotate",
        "country": "Random"
    }
)

print(res.json())`;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">How to Use SProxy Properly</h1>
        <p className="text-muted-foreground">
          Complete user guide: who this product is for, what each feature does, and how to use each one in your workflow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Is This SaaS for You?</CardTitle>
          <CardDescription>Use this quick fit check before integration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <b>Best fit:</b> developers and growth teams doing web scraping, data collection, SERP tracking, market monitoring, automation, and bot-like repeated requests where direct IPs get blocked.
          </p>
          <p>
            <b>Not ideal:</b> one-off browsing, static websites with no anti-bot checks, or use-cases that do not need IP rotation/session control.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">Scraping</Badge>
            <Badge variant="secondary">Automation</Badge>
            <Badge variant="secondary">Geo-targeting</Badge>
            <Badge variant="secondary">Sticky Sessions</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Current Account Readiness</CardTitle>
          <CardDescription>Live status from your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded border p-3">
            <p className="text-muted-foreground">Plan</p>
            <p className="font-semibold capitalize">{userPlan || "free trial"}</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-muted-foreground">Trial Requests Left</p>
            <p className="font-semibold">{trialLeft}</p>
          </div>
          <div className="rounded border p-3">
            <p className="text-muted-foreground">Active API Key</p>
            <p className="font-semibold">{activeKey ? "Available" : "Missing"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Guide (What, Why, When)</CardTitle>
          <CardDescription>Each core feature explained from a user perspective.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="proxy-gateway">
              <AccordionTrigger>1. Proxy Gateway (`/dashboard/proxy`)</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><b>What:</b> sends your target request through the proxy network.</p>
                <p><b>Why:</b> avoids bans/rate-limits from a single IP.</p>
                <p><b>When:</b> every normal scraping/automation request.</p>
                <p><b>Works how:</b> you send URL + method + headers + rotation mode; backend picks proxy, executes request, returns response + proxy metadata + usage.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sticky">
              <AccordionTrigger>2. Sticky Sessions (`/dashboard/proxy/sticky`)</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><b>What:</b> keeps same proxy identity for multiple requests in one session.</p>
                <p><b>Why:</b> useful for login/cart/step-by-step workflows that break if IP changes.</p>
                <p><b>When:</b> multi-step automations, stateful bot flows, authenticated scraping.</p>
                <p><b>Works how:</b> same `sessionId` tries to reuse same proxy until TTL expiry; tester shows if IP stayed stable.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ip-check">
              <AccordionTrigger>3. IP Check (`/dashboard/ip-check`)</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><b>What:</b> quick test endpoint for current outbound IP and latency.</p>
                <p><b>Why:</b> validates geo/mode before running expensive jobs.</p>
                <p><b>When:</b> before production runs and during debugging.</p>
                <p><b>Works how:</b> sends test URL via rotate/sticky mode and returns mode, HTTP status, latency, and proxy IP info.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="batch">
              <AccordionTrigger>4. Proxy Batches (`/dashboard/proxy/batch`)</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><b>What:</b> organize work into campaign-level groups (country/type/status).</p>
                <p><b>Why:</b> separates use-cases like “SERP US”, “Ecom DE”, “Lead gen IN”.</p>
                <p><b>When:</b> running multiple scraping pipelines.</p>
                <p><b>Works how:</b> create, pause/resume, and manage batches through API-backed CRUD.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="keys-usage-billing">
              <AccordionTrigger>5. API Keys, Usage, Billing</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><b>API Keys:</b> secure auth token management (create/disable/regenerate).</p>
                <p><b>Usage:</b> request stats, failed requests, remaining quota.</p>
                <p><b>Billing:</b> plan upgrade and subscription status.</p>
                <p><b>Why:</b> operational control + predictable spend.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Steps (Recommended Order)</CardTitle>
          <CardDescription>Minimal sequence for new users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Generate/verify an active API key in <Link href="/dashboard/api-keys" className="underline">API Keys</Link>.</p>
          <p>2. Validate connectivity in <Link href="/dashboard/ip-check" className="underline">IP Check</Link>.</p>
          <p>3. Send first real request from <Link href="/dashboard/proxy" className="underline">Proxy Gateway</Link>.</p>
          <p>4. If your flow is stateful, switch to sticky mode and verify in <Link href="/dashboard/proxy/sticky" className="underline">Sticky Tester</Link>.</p>
          <p>5. Group production workloads with <Link href="/dashboard/proxy/batch" className="underline">Proxy Batches</Link>.</p>
          <p>6. Track limits in <Link href="/dashboard/usage" className="underline">Usage</Link> and upgrade in <Link href="/dashboard/billing" className="underline">Billing</Link>.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Quick Start</CardTitle>
          <CardDescription>Use your key and call the proxy endpoint directly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-4 py-3 font-mono text-sm">{endpoint}</code>
            <Button size="icon" variant="outline" onClick={() => copyText(endpoint, "endpoint")}>
              {copiedSection === "endpoint" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-4 py-3 font-mono text-sm">{displayKey}</code>
            <Button size="icon" variant="outline" onClick={() => copyText(realKey, "apikey")}>
              {copiedSection === "apikey" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <Tabs defaultValue="curl">
            <TabsList className="mb-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>

            <TabsContent value="curl">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs"><code>{curlExample}</code></pre>
            </TabsContent>
            <TabsContent value="node">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs"><code>{nodeExample}</code></pre>
            </TabsContent>
            <TabsContent value="python">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs"><code>{pythonExample}</code></pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Readiness and Limits (Current Reality)</CardTitle>
          <CardDescription>What works now and what to verify before scaling.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Core proxy request flow works from dashboard and API route.</p>
          <p>2. Sticky mode and IP checks are available and testable from UI.</p>
          <p>3. Batch manager is dynamic and API-backed.</p>
          <p>4. Usage/billing/key management are integrated with backend state.</p>
          <p>5. For large-scale commercial use, always validate your upstream third-party proxy pool quality (Smartproxy/Oxylabs credentials/pool health) because dead pools reduce success rate.</p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <h3 className="font-medium">Need technical endpoint details?</h3>
            <p className="text-sm text-muted-foreground">See API docs and route examples.</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/docs" target="_blank" rel="noopener noreferrer">
              Open Docs
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
