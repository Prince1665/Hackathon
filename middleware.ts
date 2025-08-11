import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) {
    const cookie = req.cookies.get("session")?.value
    if (!cookie) {
      const loginPath = pathname.startsWith("/vendor") ? "/login/vendor" : "/login/admin"
      const url = req.nextUrl.clone()
      url.pathname = loginPath
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }
    try {
      const session = JSON.parse(cookie) as { user?: { role?: string } }
      if (pathname.startsWith("/admin") && session.user?.role && ["admin", "coordinator"].includes(session.user.role)) {
        return NextResponse.next()
      }
      if (pathname.startsWith("/vendor") && session.user?.role === "vendor") {
        return NextResponse.next()
      }
      // Not authorized
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    } catch {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*"],
}