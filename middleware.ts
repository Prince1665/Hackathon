import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  if (pathname === "/login" || pathname.startsWith("/login/") || pathname === "/signup") {
    return NextResponse.next()
  }

  const sessionCookie = req.cookies.get("session")?.value
  const signupCookie = req.cookies.get("signup_done")?.value

  if (!sessionCookie) {
    const url = req.nextUrl.clone()
    url.pathname = signupCookie ? "/login" : "/signup"
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)", "/admin/:path*", "/vendor/:path*"],
}