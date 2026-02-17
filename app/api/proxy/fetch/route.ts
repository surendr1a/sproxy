import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { getRandomProxy, markProxyAsBad } from "@/lib/proxy/getRandomProxy";
import { getStickyProxy } from "@/lib/proxy/stickyProxyManager";
import { recordRequest } from "@/lib/usage/usageStore";
import { verifyApiKey } from "@/lib/auth/apiKey";
import { checkRateLimit } from "@/lib/rateLimit/rateLimiter";

import {
  PLAN_GUARDS,
  fetchWithTimeout,
  readResponseWithLimit,
  resolvePlan,
} from "@/lib/guards/requestGuards";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

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
  } = await req.json();

  /* ---------------- AUTH ---------------- */

  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  console.log("this is the apikey: ", apiKey);
  const auth = verifyApiKey(apiKey || "");
  if (!auth) {
    return NextResponse.json(
      { success: false, message: "Invalid API key" },
      { status: 401 }
    );
  }

  /* ---------------- RATE LIMIT ---------------- */

  const rate = checkRateLimit(auth.apiKey, auth.plan);
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
  const stickySessionId = isSticky ? auth.userId : null;

  /* ---------------- RETRY LOOP ---------------- */

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const proxyUrl = isSticky
      ? getStickyProxy(stickySessionId!, ttl, () =>
          getRandomProxy(country)
        )
      : getRandomProxy(country);

    try {
      const agent = new ProxyAgent(proxyUrl);

      // ⏱️ TIMEOUT GUARD
      const response = await fetchWithTimeout(
        undiciFetch(url, {
          method,
          headers,
          body:
            ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && body
              ? body
              : undefined,
          dispatcher: agent,
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
      markProxyAsBad(proxyUrl);
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

  return NextResponse.json(
    {
      success: false,
      message: "All proxies failed",
      error: lastError?.message,
    },
    { status: 502 }
  );
}
