import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // ✅ JWT verify YAHAN NAHI
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
