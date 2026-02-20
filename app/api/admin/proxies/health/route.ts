import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/requireAdminUser";
import {
  getProxyHealthSnapshot,
  markProxyAsBad,
  markProxyAsHealthy,
} from "@/lib/proxy/getRandomProxy";
import { ProxyAgent, fetch as undiciFetch } from "undici";

export async function GET(req: NextRequest) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, health: await getProxyHealthSnapshot() });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { url = "https://api.ipify.org?format=json", timeoutMs = 8000 } = await req.json();
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
    checks,
    health: await getProxyHealthSnapshot(),
  });
}
