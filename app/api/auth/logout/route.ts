import { NextResponse } from "next/server"
import { signOut } from "@/lib/server/auth"

export async function POST() {
  await signOut()
  const res = NextResponse.json({ ok: true })
  // Ensure cookie cleared on response as well
  res.cookies.set("session", "", { path: "/", maxAge: 0 })
  return res
}