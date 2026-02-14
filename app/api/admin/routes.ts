import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/auth/adminauth"
import { getProxyProvider } from "@/lib/proxy/provider"

export async function GET(req: NextRequest) {
  /* ---------------- ADMIN AUTH ---------------- */
  const admin = await verifyAdmin(req)
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    )
  }

  /* ---------------- FETCH PROXIES ---------------- */
  try {
    const provider = getProxyProvider()
    const proxies = await provider.getProxies()

    const safeProxies = proxies.map((p: any) => ({
      id: p.id,
      country: p.country,
      type: p.type,
      status: p.status,
      lastCheckedAt: p.lastCheckedAt,
    }))

    return NextResponse.json({
      success: true,
      count: safeProxies.length,
      data: safeProxies,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch proxies",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
