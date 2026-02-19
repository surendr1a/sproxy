import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getRandomProxy, markProxyAsBad } from "@/lib/proxy/getRandomProxy";
import { getStickyProxy, invalidateStickyProxy } from "@/lib/proxy/stickyProxyManager";

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

  const start = Date.now();
  const isSticky = rotationMode === "sticky";
  const stickyKey = `${authUser.id}:${stickySessionId}`;

  let proxyUrl = "";
  try {
    proxyUrl = isSticky
      ? getStickyProxy(stickyKey, 600, () => getRandomProxy(country))
      : getRandomProxy(country);

    const response = await undiciFetch(url, {
      dispatcher: new ProxyAgent(proxyUrl),
    });
    const body = await response.text();

    return NextResponse.json({
      success: true,
      mode: rotationMode,
      status: response.status,
      latencyMs: Date.now() - start,
      proxy: proxyUrl.replace(/^.*@/, "").split(":")[0],
      body,
    });
  } catch (error: any) {
    if (proxyUrl) {
      markProxyAsBad(proxyUrl);
      invalidateStickyProxy(stickyKey, proxyUrl);
    }
    return NextResponse.json(
      {
        success: false,
        message: "IP check failed",
        error: error.message,
      },
      { status: 502 }
    );
  }
}
