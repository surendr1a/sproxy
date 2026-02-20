import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getProxyHealthSnapshot } from "@/lib/proxy/getRandomProxy";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    strictProxyMode:
      process.env.PROXY_STRICT_MODE === "true" ||
      process.env.NODE_ENV === "production",
    provider: process.env.PROXY_PROVIDER || "custom",
    health: await getProxyHealthSnapshot(),
  });
}
