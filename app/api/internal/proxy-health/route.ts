import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import {
  getProxyHealthSnapshot,
  markProxyAsBad,
  markProxyAsHealthy,
} from "@/lib/proxy/getRandomProxy";

function isAuthorized(req: NextRequest) {
  const token = req.headers.get("x-cron-token");
  return !!token && token === process.env.INTERNAL_CRON_TOKEN;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url = "https://api.ipify.org?format=json", timeoutMs = 8000 } = await req
    .json()
    .catch(() => ({}));

  const health = await getProxyHealthSnapshot();
  const checks = await Promise.all(
    health.bad.map(async (proxy) => {
      try {
        const timeout = setTimeout(() => null, timeoutMs);
        const res = await undiciFetch(url, { dispatcher: new ProxyAgent(proxy) });
        clearTimeout(timeout);
        if (res.ok) {
          await markProxyAsHealthy(proxy);
          return { proxy, recovered: true };
        }
      } catch {
        await markProxyAsBad(proxy);
      }
      return { proxy, recovered: false };
    })
  );

  return NextResponse.json({
    success: true,
    checked: checks.length,
    recovered: checks.filter((c) => c.recovered).length,
    health: await getProxyHealthSnapshot(),
  });
}
