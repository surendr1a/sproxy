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

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const STRICT_PROXY_MODE =
  process.env.PROXY_STRICT_MODE === "true" ||
  process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  const {
    url,
    method = "GET",
    headers = {},
    body,
    rotationMode = "rotate", // rotate | sticky (from frontend)
    ttl = 600,
    country,
    stickySessionId,
  } = await req.json();

  /* ---------------- AUTH ---------------- */

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

  /* ---------------- RATE LIMIT ---------------- */

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

  /* ---------------- VALIDATION ---------------- */

  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { success: false, message: "Valid target URL is required" },
      { status: 400 }
    );
  }

  /* ---------------- PLAN GUARDS ---------------- */

  const plan = resolvePlan(auth.plan);
  const { timeoutMs, maxResponseSize } = PLAN_GUARDS[plan];

  let lastError: any = null;

  const isSticky = rotationMode === "sticky";
  const stickyKey = isSticky
    ? `${auth.userId || auth.apiKey}:${stickySessionId || "default"}`
    : null;
  const attemptedProxies = new Set<string>();

  /* ---------------- RETRY LOOP ---------------- */

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let proxyUrl = "";

    try {
      proxyUrl = isSticky
        ? await getStickyProxy(stickyKey!, ttl, () =>
            getRandomProxy(country, undefined, attemptedProxies)
          )
        : await getRandomProxy(country, undefined, attemptedProxies);
    } catch (error: any) {
      lastError = error;
      break;
    }

    attemptedProxies.add(proxyUrl);

    try {
      const agent = new ProxyAgent(proxyUrl);

      // ⏱️ TIMEOUT GUARD
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

      // 📦 RESPONSE SIZE GUARD
      const responseBody = await readResponseWithLimit(
        response,
        maxResponseSize
      );

      const latency = Date.now() - startTime;
      await markProxyAsHealthy(proxyUrl);

      /* ---------------- USAGE LOG ---------------- */

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
      if (auth.userId && auth.plan === "free") {
        await User.updateOne(
          { _id: auth.userId, trialRequestsRemaining: { $gt: 0 } },
          { $inc: { trialRequestsRemaining: -1 } }
        );
      }
      await trackEvent({
        userId: auth.userId,
        event: "proxy_request_success",
        source: "proxy.fetch",
        metadata: {
          mode: rotationMode,
          country: country || "Random",
          status: response.status,
        },
      });

      /* ---------------- FRONTEND FRIENDLY RESPONSE ---------------- */

      return NextResponse.json(
        {
          success: true,
          status: response.status,
          body: responseBody,
          proxy: {
            ip: proxyUrl.replace(/^.*@/, "").split(":")[0],
            country: country || "Random",
            mode: rotationMode,
            latencyMs: latency,
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

      // ❌ FAILURE LOG
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

      if (attempt < MAX_RETRIES) {
        await new Promise((res) =>
          setTimeout(res, RETRY_DELAY_MS * attempt)
        );
      }
    }
  }

  /* ---------------- FINAL FAILURE ---------------- */

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
    if (auth.userId && auth.plan === "free") {
      await User.updateOne(
        { _id: auth.userId, trialRequestsRemaining: { $gt: 0 } },
        { $inc: { trialRequestsRemaining: -1 } }
      );
    }
    await dispatchUserAlert({
      userId: auth.userId,
      event: "proxy.all_failed",
      payload: {
        url,
        mode: rotationMode,
        country: country || "Random",
        error: lastError?.message,
      },
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

  // Fallback for dashboard usability when proxy pool is temporarily unhealthy.
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
    if (auth.userId && auth.plan === "free") {
      await User.updateOne(
        { _id: auth.userId, trialRequestsRemaining: { $gt: 0 } },
        { $inc: { trialRequestsRemaining: -1 } }
      );
    }
    await dispatchUserAlert({
      userId: auth.userId,
      event: "proxy.direct_fallback",
      payload: {
        url,
        mode: rotationMode,
        country: country || "Random",
      },
    });

    return NextResponse.json(
      {
        success: true,
        status: directResponse.status,
        body: responseBody,
        proxy: {
          ip: "N/A",
          country: country || "Random",
          mode: "direct-fallback",
          latencyMs: Date.now() - startTime,
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
  if (auth.userId && auth.plan === "free") {
    await User.updateOne(
      { _id: auth.userId, trialRequestsRemaining: { $gt: 0 } },
      { $inc: { trialRequestsRemaining: -1 } }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: "All proxies failed",
      error: lastError?.message,
    },
    { status: 502 }
  );
}
