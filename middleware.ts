import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/report") || pathname.startsWith("/item")) {
    const cookie = req.cookies.get("session")?.value
    if (!cookie) {
      let loginPath = "/login"
      if (pathname.startsWith("/vendor")) loginPath = "/login/vendor"
      else if (pathname.startsWith("/admin") || pathname.startsWith("/item")) loginPath = "/login/admin"
      else if (pathname.startsWith("/report")) loginPath = "/login/student"
      const url = req.nextUrl.clone()
      url.pathname = loginPath
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }
    try {
      const session = typeof cookie === "string" && cookie.trim().startsWith("{") ? JSON.parse(cookie) as { user?: { role?: string } } : { user: null }
      if (pathname.startsWith("/admin") && session.user?.role === "admin") {
        const res = NextResponse.next()
        res.headers.set("Cache-Control", "no-store")
        return res
      }
      if (pathname.startsWith("/vendor") && (session.user?.role === "vendor" || session.user?.role === "admin")) {
        const res = NextResponse.next()
        res.headers.set("Cache-Control", "no-store")
        return res
      }
      if (pathname.startsWith("/report") && (session.user?.role === "admin" || session.user?.role === "student" || session.user?.role === "coordinator")) {
        const res = NextResponse.next()
        res.headers.set("Cache-Control", "no-store")
        return res
      }
      if (pathname.startsWith("/item") && session.user?.role === "admin") {
        const res = NextResponse.next()
        res.headers.set("Cache-Control", "no-store")
        return res
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
  matcher: ["/admin/:path*", "/vendor/:path*", "/report", "/item/:path*"],
}