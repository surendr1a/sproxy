import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import {
  getRandomProxy,
  markProxyAsBad,
  markProxyAsHealthy,
} from "@/lib/proxy/getRandomProxy";
import { getStickyProxy, invalidateStickyProxy } from "@/lib/proxy/stickyProxyManager";
import { recordRequest } from "@/lib/usage/usageStore";
import { verifyApiKey } from "@/lib/auth/apiKey";
import { checkRateLimit } from "@/lib/rateLimit/rateLimiter";
import { persistUsageEvent } from "@/lib/usage/persistUsage";
import { connectDB } from "@/lib/db";
import { ApiKey } from "@/lib/models/ApiKey";
import { User } from "@/lib/models/User";
import {
  PLAN_GUARDS,
  fetchWithTimeout,
  readResponseWithLimit,
  resolvePlan,
} from "@/lib/guards/requestGuards";
import { dispatchUserAlert } from "@/lib/alerts/dispatchAlert";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { computeCarryoverPaidRequests } from "@/lib/billing/requestCredits";
import { persistProxyRequestLog } from "@/lib/logging/proxyRequestLog";
import {
  getEffectiveProviderOrder,
  getProxyProviderName,
} from "@/lib/routing/providerRouting";
import type { ProxyProviderName } from "@/lib/proxy/providerFactory";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const STRICT_PROXY_MODE =
  process.env.PROXY_STRICT_MODE === "true" ||
  process.env.NODE_ENV === "production";
const PAID_PLANS = new Set(["starter", "pro", "business", "enterprise"]);

function isPaidPlan(plan: string) {
  return PAID_PLANS.has(plan);
}

function normalizeCountry(country?: string) {
  const value = (country || "").trim().toUpperCase();
  if (!value || value === "RANDOM" || value === "ANY" || value === "ALL") return "Random";
  return value;
}

function proxyMatchesCountry(proxy: string, country: string) {
  if (!country || country === "Random") return true;
  const upper = country.toUpperCase();
  const tagged = proxy.match(/\/\/([A-Z]{2})@/i)?.[1]?.toUpperCase();
  if (tagged) return tagged === upper;
  return proxy.toUpperCase().includes(upper);
}

function pickFromPool(
  pool: string[],
  country: string,
  excluded: Set<string>
): string | null {
  const candidates = pool
    .filter((proxy) => !excluded.has(proxy))
    .filter((proxy) => proxyMatchesCountry(proxy, country));

  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] || null;
}

function buildProviderAttempts(order: ProxyProviderName[], maxAttempts: number) {
  const attempts: ProxyProviderName[] = [];
  if (!order.length) return attempts;

  for (let i = 0; i < maxAttempts; i++) {
    attempts.push(order[i % order.length]);
  }
  return attempts;
}

async function consumeRequestBalance(userId: string | undefined, plan: string) {
  if (!userId) return;
  if (plan === "free") {
    await User.updateOne(
      { _id: userId, trialRequestsRemaining: { $gt: 0 } },
      { $inc: { trialRequestsRemaining: -1 } }
    );
    return;
  }
  if (isPaidPlan(plan)) {
    await User.updateOne(
      { _id: userId, paidRequestsRemaining: { $gt: 0 } },
      { $inc: { paidRequestsRemaining: -1 } }
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  const {
    url,
    method = "GET",
    headers = {},
    body,
    rotationMode = "rotate",
    ttl = 600,
    country,
    stickySessionId,
  } = await req.json();

  const normalizedCountry = normalizeCountry(country);

  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  const auth = await verifyApiKey(apiKey || "");
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  const rate = await checkRateLimit(auth.apiKey, auth.plan);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Rate limit exceeded",
        limit: rate.limit,
        resetAt: rate.resetAt,
      },
      { status: 429 }
    );
  }

  if (auth.userId && isPaidPlan(auth.plan)) {
    await connectDB();
    const user = await User.findById(auth.userId).select("paidRequestsRemaining");
    let paidRequestsRemaining = user?.paidRequestsRemaining;
    if (typeof paidRequestsRemaining !== "number") {
      paidRequestsRemaining = await computeCarryoverPaidRequests(auth.userId);
      await User.updateOne(
        { _id: auth.userId },
        { $set: { paidRequestsRemaining } }
      );
    }
    if (paidRequestsRemaining <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan request quota exhausted. Please recharge or upgrade.",
        },
        { status: 429 }
      );
    }
  }

  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { success: false, message: "Valid target URL is required" },
      { status: 400 }
    );
  }

  const plan = resolvePlan(auth.plan);
  const { timeoutMs, maxResponseSize } = PLAN_GUARDS[plan];

  let lastError: any = null;
  let lastProvider: string = "unknown";

  const isSticky = rotationMode === "sticky";
  const stickyKey = isSticky
    ? `${auth.userId || auth.apiKey}:${stickySessionId || "default"}`
    : null;
  const attemptedProxies = new Set<string>();

  const routing = auth.userId
    ? await getEffectiveProviderOrder(auth.userId, auth.workspaceId)
    : null;
  const routingEnabled = Boolean(routing?.config.enabled);
  const providerOrder = routingEnabled && routing?.availableOrder?.length
    ? routing.availableOrder
    : [];

  const maxProviderAttempts = routingEnabled
    ? routing?.config.maxProviderAttempts || MAX_RETRIES
    : MAX_RETRIES;

  const providerAttempts = providerOrder.length
    ? buildProviderAttempts(providerOrder, maxProviderAttempts)
    : [];

  for (let attempt = 1; attempt <= Math.max(MAX_RETRIES, providerAttempts.length || 0); attempt++) {
    let proxyUrl = "";
    let providerUsed: ProxyProviderName | "unknown" = "unknown";

    try {
      if (providerAttempts.length && routing) {
        const candidateProvider = providerAttempts[attempt - 1] || providerAttempts[0];
        const candidateProxy = pickFromPool(
          routing.pools[candidateProvider] || [],
          normalizedCountry,
          attemptedProxies
        );
        if (!candidateProxy) {
          throw new Error(`No healthy proxies in provider: ${candidateProvider}`);
        }

        providerUsed = candidateProvider;
        proxyUrl = isSticky
          ? await getStickyProxy(stickyKey!, ttl, async () => candidateProxy)
          : candidateProxy;
      } else {
        proxyUrl = isSticky
          ? await getStickyProxy(stickyKey!, ttl, () =>
              getRandomProxy(normalizedCountry, undefined, attemptedProxies)
            )
          : await getRandomProxy(normalizedCountry, undefined, attemptedProxies);

        providerUsed = getProxyProviderName(proxyUrl);
      }
    } catch (error: any) {
      lastError = error;
      if (!providerAttempts.length || attempt >= MAX_RETRIES) {
        break;
      }
      continue;
    }

    attemptedProxies.add(proxyUrl);
    lastProvider = providerUsed;

    try {
      const agent = new ProxyAgent(proxyUrl);

      const response = await fetchWithTimeout(
        (signal) =>
          undiciFetch(url, {
            method,
            headers,
            body:
              ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && body
                ? body
                : undefined,
            dispatcher: agent,
            signal,
          }),
        timeoutMs
      );

      if (response.status >= 500) {
        throw new Error(`Upstream server error: ${response.status}`);
      }

      const responseBody = await readResponseWithLimit(
        response,
        maxResponseSize
      );

      const latency = Date.now() - startTime;
      await markProxyAsHealthy(proxyUrl);

      recordRequest({
        userId: auth.userId,
        apiKey: auth.apiKey,
        plan: auth.plan,
        time: Date.now(),
        url,
        proxy: proxyUrl,
        success: true,
        status: response.status,
      });

      await connectDB();
      await Promise.all([
        ApiKey.updateOne({ key: auth.apiKey }, { lastUsedAt: new Date() }),
        persistUsageEvent({
          userId: auth.userId,
          workspaceId: auth.workspaceId,
          success: true,
        }),
      ]);
      await consumeRequestBalance(auth.userId, auth.plan);
      await trackEvent({
        userId: auth.userId,
        event: "proxy_request_success",
        source: "proxy.fetch",
        metadata: {
          mode: rotationMode,
          country: normalizedCountry,
          status: response.status,
          provider: providerUsed,
        },
      });
      await persistProxyRequestLog({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        apiKey: auth.apiKey,
        targetUrl: url,
        method,
        status: response.status,
        success: true,
        provider: providerUsed,
        proxyMode: rotationMode,
        country: normalizedCountry,
        latencyMs: latency,
        requestHeaders: headers,
        requestBody: typeof body === "string" ? body : JSON.stringify(body || ""),
        responsePreview: responseBody.slice(0, 2000),
      });

      return NextResponse.json(
        {
          success: true,
          status: response.status,
          body: responseBody,
          proxy: {
            ip: proxyUrl.replace(/^.*@/, "").split(":")[0],
            country: normalizedCountry,
            mode: rotationMode,
            latencyMs: latency,
            provider: providerUsed,
          },
          usage: {
            consumed: 1,
            remaining: rate.remaining,
          },
        },
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    } catch (error: any) {
      await markProxyAsBad(proxyUrl);
      if (isSticky && stickyKey) {
        await invalidateStickyProxy(stickyKey, proxyUrl);
      }
      lastError = error;

      recordRequest({
        userId: auth.userId,
        apiKey: auth.apiKey,
        plan: auth.plan,
        time: Date.now(),
        url,
        proxy: proxyUrl,
        success: false,
        error: error.message,
      });

      if (attempt < Math.max(MAX_RETRIES, providerAttempts.length || 0)) {
        await new Promise((res) =>
          setTimeout(res, RETRY_DELAY_MS * attempt)
        );
      }
    }
  }

  if (STRICT_PROXY_MODE) {
    await connectDB();
    await Promise.all([
      ApiKey.updateOne({ key: auth.apiKey }, { lastUsedAt: new Date() }),
      persistUsageEvent({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        success: false,
      }),
    ]);
    await consumeRequestBalance(auth.userId, auth.plan);
    await dispatchUserAlert({
      userId: auth.userId,
      event: "proxy.all_failed",
      payload: {
        url,
        mode: rotationMode,
        country: normalizedCountry,
        error: lastError?.message,
      },
    });
    await persistProxyRequestLog({
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      apiKey: auth.apiKey,
      targetUrl: url,
      method,
      status: 0,
      success: false,
      error: lastError?.message || "All proxies failed",
      provider: lastProvider,
      proxyMode: rotationMode,
      country: normalizedCountry,
      requestHeaders: headers,
      requestBody: typeof body === "string" ? body : JSON.stringify(body || ""),
      responsePreview: "",
    });
    return NextResponse.json(
      {
        success: false,
        message: "All proxies failed",
        error: lastError?.message,
        strict: true,
      },
      { status: 502 }
    );
  }

  try {
    const directResponse = await fetchWithTimeout(
      (signal) =>
        undiciFetch(url, {
          method,
          headers,
          body:
            ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && body
              ? body
              : undefined,
          signal,
        }),
      timeoutMs
    );

    const responseBody = await readResponseWithLimit(
      directResponse,
      maxResponseSize
    );

    recordRequest({
      userId: auth.userId,
      apiKey: auth.apiKey,
      plan: auth.plan,
      time: Date.now(),
      url,
      proxy: "direct",
      success: true,
      status: directResponse.status,
    });

    await connectDB();
    await Promise.all([
      ApiKey.updateOne({ key: auth.apiKey }, { lastUsedAt: new Date() }),
      persistUsageEvent({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        success: true,
      }),
    ]);
    await consumeRequestBalance(auth.userId, auth.plan);
    await dispatchUserAlert({
      userId: auth.userId,
      event: "proxy.direct_fallback",
      payload: {
        url,
        mode: rotationMode,
        country: normalizedCountry,
      },
    });
    await persistProxyRequestLog({
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      apiKey: auth.apiKey,
      targetUrl: url,
      method,
      status: directResponse.status,
      success: true,
      provider: "direct-fallback",
      proxyMode: rotationMode,
      country: normalizedCountry,
      latencyMs: Date.now() - startTime,
      usedDirectFallback: true,
      requestHeaders: headers,
      requestBody: typeof body === "string" ? body : JSON.stringify(body || ""),
      responsePreview: responseBody.slice(0, 2000),
    });

    return NextResponse.json(
      {
        success: true,
        status: directResponse.status,
        body: responseBody,
        proxy: {
          ip: "N/A",
          country: normalizedCountry,
          mode: "direct-fallback",
          latencyMs: Date.now() - startTime,
          provider: "direct-fallback",
        },
        usage: {
          consumed: 1,
          remaining: rate.remaining,
        },
        warning:
          "All configured proxies failed. Served via direct fallback request.",
      },
      { status: 200 }
    );
  } catch (directError: any) {
    lastError = directError;
  }

  await connectDB();
  await Promise.all([
    ApiKey.updateOne({ key: auth.apiKey }, { lastUsedAt: new Date() }),
    persistUsageEvent({
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      success: false,
    }),
  ]);
  await consumeRequestBalance(auth.userId, auth.plan);
  await persistProxyRequestLog({
    userId: auth.userId,
    workspaceId: auth.workspaceId,
    apiKey: auth.apiKey,
    targetUrl: url,
    method,
    status: 0,
    success: false,
    error: lastError?.message || "All proxies failed",
    provider: lastProvider,
    proxyMode: rotationMode,
    country: normalizedCountry,
    requestHeaders: headers,
    requestBody: typeof body === "string" ? body : JSON.stringify(body || ""),
    responsePreview: "",
  });

  return NextResponse.json(
    {
      success: false,
      message: "All proxies failed",
      error: lastError?.message,
    },
    { status: 502 }
  );
}
