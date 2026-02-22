"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { notifySuccess } from "@/lib/toast";
import { Check, Copy } from "lucide-react";

const BASE_URL = "https://your-domain.com";

const nodeSdk = `npm i @sproxy/sdk\n\nimport { SProxyClient } from "@sproxy/sdk";\n\nconst client = new SProxyClient({\n  apiKey: process.env.SPROXY_API_KEY,\n  baseUrl: "${BASE_URL}"\n});\n\nconst res = await client.fetch({\n  url: "https://httpbin.org/get",\n  method: "GET",\n  rotationMode: "rotate",\n  country: "US"\n});\n\nconsole.log(res.status, res.proxy);`;

const pythonSdk = `pip install sproxy-sdk\n\nfrom sproxy import SProxyClient\n\nclient = SProxyClient(\n    api_key="${"${SPROXY_API_KEY}"}",\n    base_url="${BASE_URL}"\n)\n\nres = client.fetch(\n    url="https://httpbin.org/get",\n    method="GET",\n    rotation_mode="sticky",\n    sticky_session_id="checkout-flow",\n    country="DE"\n)\n\nprint(res.status_code, res.proxy)`;

const curlRecipes = {
  rotate: `curl -X POST "${BASE_URL}/api/proxy/fetch" \\
  -H "Authorization: Bearer ${"${API_KEY}"}" \\
  -H "Content-Type: application/json" \\
  -d '{\n    "url": "https://httpbin.org/get",\n    "method": "GET",\n    "rotationMode": "rotate",\n    "country": "Random"\n  }'`,
  sticky: `curl -X POST "${BASE_URL}/api/proxy/fetch" \\
  -H "Authorization: Bearer ${"${API_KEY}"}" \\
  -H "Content-Type: application/json" \\
  -d '{\n    "url": "https://httpbin.org/anything",\n    "method": "GET",\n    "rotationMode": "sticky",\n    "stickySessionId": "cart-flow-user-112",\n    "ttl": 600,\n    "country": "US"\n  }'`,
  postJson: `curl -X POST "${BASE_URL}/api/proxy/fetch" \\
  -H "Authorization: Bearer ${"${API_KEY}"}" \\
  -H "Content-Type: application/json" \\
  -d '{\n    "url": "https://httpbin.org/post",\n    "method": "POST",\n    "headers": {"Content-Type": "application/json"},\n    "body": "{\\"name\\":\\"sproxy\\"}",\n    "rotationMode": "rotate",\n    "country": "IN"\n  }'`,
};

export default function DevelopersSdkPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    notifySuccess("Copied", "Snippet copied to clipboard.");
    setTimeout(() => setCopied(null), 1200);
  };

  const copyButton = (value: string, key: string) => (
    <Button variant="outline" size="sm" onClick={() => copy(value, key)}>
      {copied === key ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}Copy
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Simple SDKs + Recipes</h1>
        <p className="text-muted-foreground">Fast integration snippets for Node, Python and cURL use-cases.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">SDK</p><p className="mt-1 text-xl font-semibold">Node.js</p><Badge variant="secondary">Quick start</Badge></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">SDK</p><p className="mt-1 text-xl font-semibold">Python</p><Badge variant="secondary">Quick start</Badge></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Format</p><p className="mt-1 text-xl font-semibold">cURL Recipes</p><Badge variant="outline">Copy-paste ready</Badge></CardContent></Card>
      </div>

      <Tabs defaultValue="node" className="space-y-4">
        <TabsList>
          <TabsTrigger value="node">Node SDK</TabsTrigger>
          <TabsTrigger value="python">Python SDK</TabsTrigger>
          <TabsTrigger value="recipes">cURL Recipes</TabsTrigger>
        </TabsList>

        <TabsContent value="node">
          <Card>
            <CardHeader>
              <CardTitle>Node SDK</CardTitle>
              <CardDescription>Install and start making proxy calls in under 2 minutes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs"><code>{nodeSdk}</code></pre>
              {copyButton(nodeSdk, "node")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python">
          <Card>
            <CardHeader>
              <CardTitle>Python SDK</CardTitle>
              <CardDescription>Script-ready wrapper for scraping and automation workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs"><code>{pythonSdk}</code></pre>
              {copyButton(pythonSdk, "python")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes">
          <Card>
            <CardHeader>
              <CardTitle>Copy-Paste Recipes</CardTitle>
              <CardDescription>Ready payloads for common proxy scenarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.entries(curlRecipes) as Array<[string, string]>).map(([key, value]) => (
                <div key={key} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium capitalize">{key}</p>
                    {copyButton(value, `recipe-${key}`)}
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 text-xs whitespace-pre-wrap"><code>{value}</code></pre>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
