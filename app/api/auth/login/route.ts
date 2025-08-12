import { NextResponse } from "next/server"
import { signInWithPassword } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }))
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }
  const session = await signInWithPassword(email, password)
  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  const res = NextResponse.json({ user: session.user }, { headers: { "Cache-Control": "no-store" } })
  const isProd = process.env.NODE_ENV === "production"
  res.cookies.set("session", JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: isProd,
  })
  return res
}