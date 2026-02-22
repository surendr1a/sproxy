import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getStickyProxy, invalidateStickyProxy } from "@/lib/proxy/stickyProxyManager";
import {
  getRandomProxy,
  markProxyAsBad,
  markProxyAsHealthy,
} from "@/lib/proxy/getRandomProxy";

type StickyResult = {
  requestNo: number;
  ip: string;
  proxyIp: string;
  country: string;
  responseTime: number;
  sticky: boolean;
  status: number;
  ok: boolean;
  error?: string;
};

function safeExtractIp(responseText: string) {
  try {
    const parsed = JSON.parse(responseText);
    if (typeof parsed?.ip === "string") return parsed.ip;
  } catch {}
  const match = responseText.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/);
  return match?.[0] || "unknown";
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

  const normalizedUrl = String(url || "").trim();
  const normalizedSessionId =
    typeof sessionId === "string" && sessionId.trim() ? sessionId.trim().slice(0, 80) : "session_default";
  const normalizedCountry =
    typeof country === "string" && country.trim() ? country.trim().toUpperCase() : "Random";

  const normalizedCount = Math.max(1, Math.min(Number(requestCount) || 5, 20));
  const normalizedDelay = Math.max(0, Math.min(Number(delay) || 1000, 5000));
  const stickyKey = `${authUser.id}:${normalizedSessionId}`;

  if (!isValidHttpUrl(normalizedUrl)) {
    return NextResponse.json(
      { error: "Target URL must be a valid HTTP/HTTPS URL." },
      { status: 400 }
    );
  }

  const results: StickyResult[] = [];
  let baseIp = "";

  for (let i = 1; i <= normalizedCount; i++) {
    const stepStart = Date.now();
    let proxyUrl = "";

    try {
      proxyUrl = await getStickyProxy(stickyKey, 600, () => getRandomProxy(normalizedCountry));
      const response = await undiciFetch(normalizedUrl, {
        dispatcher: new ProxyAgent(proxyUrl),
      });

      const body = await response.text();
      await markProxyAsHealthy(proxyUrl);
      const ip = safeExtractIp(body);
      const proxyIp = proxyUrl.replace(/^.*@/, "").split(":")[0] || "unknown";
      if (!baseIp) baseIp = ip;

      results.push({
        requestNo: i,
        ip,
        proxyIp,
        country: normalizedCountry,
        responseTime: Date.now() - stepStart,
        sticky: ip === baseIp,
        status: response.status,
        ok: response.ok,
      });
    } catch (err: any) {
      if (proxyUrl) {
        await markProxyAsBad(proxyUrl);
        await invalidateStickyProxy(stickyKey, proxyUrl);
      }
      results.push({
        requestNo: i,
        ip: "failed",
        proxyIp: proxyUrl ? proxyUrl.replace(/^.*@/, "").split(":")[0] : "failed",
        country: normalizedCountry,
        responseTime: Date.now() - stepStart,
        sticky: false,
        status: 0,
        ok: false,
        error: err?.message || "Request failed",
      });
    }

    if (i < normalizedCount && normalizedDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, normalizedDelay));
    }
  }

  return NextResponse.json({
    success: true,
    mode: "sticky",
    targetUrl: normalizedUrl,
    sessionId: normalizedSessionId,
    country: normalizedCountry,
    requestCount: normalizedCount,
    delay: normalizedDelay,
    results,
    summary: {
      total: results.length,
      successCount: results.filter((r) => r.ok).length,
      failedCount: results.filter((r) => !r.ok).length,
      uniqueIps: [...new Set(results.filter((r) => r.ok).map((r) => r.ip))].length,
      stickyPercent: results.length
        ? Math.round((results.filter((r) => r.sticky).length / results.length) * 100)
        : 0,
      avgLatencyMs: results.length
        ? Math.round(
            results.reduce((sum, r) => sum + (Number.isFinite(r.responseTime) ? r.responseTime : 0), 0) /
              results.length
          )
        : 0,
      baselineIp: baseIp || null,
    },
  });
}
