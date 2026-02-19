import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getStickyProxy, invalidateStickyProxy } from "@/lib/proxy/stickyProxyManager";
import { getRandomProxy, markProxyAsBad } from "@/lib/proxy/getRandomProxy";

type StickyResult = {
  requestNo: number;
  ip: string;
  country: string;
  responseTime: number;
  sticky: boolean;
  status: number;
};

function safeExtractIp(responseText: string) {
  try {
    const parsed = JSON.parse(responseText);
    if (typeof parsed?.ip === "string") return parsed.ip;
  } catch {}
  const match = responseText.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
  return match?.[0] || "unknown";
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    url = "https://api.ipify.org?format=json",
    sessionId = "session_default",
    requestCount = 5,
    delay = 1000,
    country = "Random",
  } = await req.json();

  const normalizedCount = Math.max(1, Math.min(Number(requestCount) || 5, 20));
  const normalizedDelay = Math.max(0, Math.min(Number(delay) || 1000, 5000));
  const stickyKey = `${authUser.id}:${sessionId}`;

  const results: StickyResult[] = [];
  let baseIp = "";

  for (let i = 1; i <= normalizedCount; i++) {
    const stepStart = Date.now();
    let proxyUrl = "";

    try {
      proxyUrl = getStickyProxy(stickyKey, 600, () => getRandomProxy(country));
      const response = await undiciFetch(url, {
        dispatcher: new ProxyAgent(proxyUrl),
      });

      const body = await response.text();
      const ip = safeExtractIp(body);
      if (!baseIp) baseIp = ip;

      results.push({
        requestNo: i,
        ip,
        country: country || "Random",
        responseTime: Date.now() - stepStart,
        sticky: ip === baseIp,
        status: response.status,
      });
    } catch {
      if (proxyUrl) {
        markProxyAsBad(proxyUrl);
        invalidateStickyProxy(stickyKey, proxyUrl);
      }
      results.push({
        requestNo: i,
        ip: "failed",
        country: country || "Random",
        responseTime: Date.now() - stepStart,
        sticky: false,
        status: 0,
      });
    }

    if (i < normalizedCount && normalizedDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, normalizedDelay));
    }
  }

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: results.length,
      uniqueIps: [...new Set(results.map((r) => r.ip))].length,
      stickyPercent:
        results.length > 0
          ? Math.round((results.filter((r) => r.sticky).length / results.length) * 100)
          : 0,
    },
  });
}
