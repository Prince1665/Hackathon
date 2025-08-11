import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/auth"
  ) {
    return NextResponse.next()
  }

  const sessionCookie = req.cookies.get("session")?.value

  if (!sessionCookie) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  try {
    const session = JSON.parse(sessionCookie) as { user?: { role?: string } }
    if (pathname.startsWith("/admin")) {
      if (session.user?.role && ["admin", "coordinator"].includes(session.user.role)) {
        return NextResponse.next()
      }
      const url = req.nextUrl.clone()
      url.pathname = "/auth"
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith("/vendor")) {
      if (session.user?.role === "vendor") {
        return NextResponse.next()
      }
      const url = req.nextUrl.clone()
      url.pathname = "/auth"
      return NextResponse.redirect(url)
    }
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|auth).*)", "/admin/:path*", "/vendor/:path*"],
}