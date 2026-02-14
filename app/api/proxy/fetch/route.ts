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
  const {
    url,
    method = "GET",
    headers = {},
    sticky = false,
    ttl = 600,
    stickySessionId,
    country,
  } = await req.json();

  /* ---------------- AUTH ---------------- */

  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

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

  if (!url) {
    return NextResponse.json(
      { success: false, message: "Target URL is required" },
      { status: 400 }
    );
  }

  if (sticky && !stickySessionId) {
    return NextResponse.json(
      { success: false, message: "Session ID is required for sticky mode" },
      { status: 400 }
    );
  }

  /* ---------------- PLAN GUARDS ---------------- */

  const plan = resolvePlan(auth.plan);
  const { timeoutMs, maxResponseSize } = PLAN_GUARDS[plan];

  let lastError: any = null;

  /* ---------------- RETRY LOOP ---------------- */

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const proxyUrl =
      sticky && stickySessionId
        ? getStickyProxy(stickySessionId, ttl, () => getRandomProxy(country))
        : getRandomProxy(country);

    try {
      const agent = new ProxyAgent(proxyUrl);

      // ⏱️ TIMEOUT GUARD
      const response = await fetchWithTimeout(
        undiciFetch(url, {
          method,
          headers,
          dispatcher: agent,
        }),
        timeoutMs
      );

      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // 📦 RESPONSE SIZE GUARD
      const data = await readResponseWithLimit(
        response,
        maxResponseSize
      );


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

      return new NextResponse(data, {
        status: response.status,
        headers: {
          "content-type":
            response.headers.get("content-type") || "text/plain",
        },
      });
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

  return NextResponse.json(
    {
      success: false,
      message: "All proxies failed",
      error: lastError?.message,
    },
    { status: 502 }
  );
}
