import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow static assets and API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // Allow login routes without session
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next()
  }

  const cookie = req.cookies.get("session")?.value
  if (!cookie) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  // If session exists, optionally enforce role-based restrictions
  try {
    const session = JSON.parse(cookie) as { user?: { role?: string } }
    if (pathname.startsWith("/admin")) {
      if (session.user?.role && ["admin", "coordinator"].includes(session.user.role)) {
        return NextResponse.next()
      }
      const url = req.nextUrl.clone()
      url.pathname = "/login/admin"
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith("/vendor")) {
      if (session.user?.role === "vendor") {
        return NextResponse.next()
      }
      const url = req.nextUrl.clone()
      url.pathname = "/login/vendor"
      return NextResponse.redirect(url)
    }
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)", "/admin/:path*", "/vendor/:path*"],
}