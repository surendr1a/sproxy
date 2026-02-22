import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import {
  getRandomProxy,
  markProxyAsBad,
  markProxyAsHealthy,
} from "@/lib/proxy/getRandomProxy";
import { getStickyProxy, invalidateStickyProxy } from "@/lib/proxy/stickyProxyManager";

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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
    country,
    rotationMode = "rotate",
    stickySessionId = "default",
  } = await req.json();
  const normalizedUrl = String(url || "").trim();
  const normalizedMode = rotationMode === "sticky" ? "sticky" : "rotate";
  const normalizedCountry =
    typeof country === "string" && country.trim() ? country.trim().toUpperCase() : "Random";
  const normalizedStickyId =
    typeof stickySessionId === "string" && stickySessionId.trim()
      ? stickySessionId.trim().slice(0, 80)
      : "default";

  if (!isValidHttpUrl(normalizedUrl)) {
    return NextResponse.json(
      {
        success: false,
        message: "IP check failed",
        error: "Please provide a valid HTTP/HTTPS target URL.",
      },
      { status: 400 }
    );
  }

  const start = Date.now();
  const isSticky = normalizedMode === "sticky";
  const stickyKey = `${authUser.id}:${normalizedStickyId}`;

  let proxyUrl = "";
  try {
    proxyUrl = isSticky
      ? await getStickyProxy(stickyKey, 600, () => getRandomProxy(normalizedCountry))
      : await getRandomProxy(normalizedCountry);

    const response = await undiciFetch(normalizedUrl, {
      dispatcher: new ProxyAgent(proxyUrl),
    });
    const body = await response.text();
    const parsed = safeParseJson(body);
    await markProxyAsHealthy(proxyUrl);

    return NextResponse.json({
      success: true,
      mode: normalizedMode,
      status: response.status,
      ok: response.ok,
      latencyMs: Date.now() - start,
      proxy: proxyUrl.replace(/^.*@/, "").split(":")[0],
      targetUrl: normalizedUrl,
      country: normalizedCountry,
      stickySessionId: isSticky ? normalizedStickyId : null,
      responseHeaders: {
        contentType: response.headers.get("content-type"),
        server: response.headers.get("server"),
      },
      bodyPreview: body.slice(0, 2000),
      bodyJson: parsed,
      body,
    });
  } catch (error: any) {
    if (proxyUrl) {
      await markProxyAsBad(proxyUrl);
      await invalidateStickyProxy(stickyKey, proxyUrl);
    }
    return NextResponse.json(
      {
        success: false,
        message: "IP check failed",
        error: error?.message || "Unknown error",
        mode: normalizedMode,
        targetUrl: normalizedUrl,
        country: normalizedCountry,
        stickySessionId: isSticky ? normalizedStickyId : null,
      },
      { status: 502 }
    );
  }
}
