import { NextResponse } from "next/server"
import { signOut } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  await signOut()
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  // Ensure cookie cleared on response as well
  res.cookies.set("session", "", { path: "/", maxAge: 0, secure: process.env.NODE_ENV === "production" })
  return res
}