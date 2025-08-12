export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/server/auth-mongo"

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const id = cookie.match(/sessionId=([^;]+)/)?.[1]
  if (id) await deleteSession(id)
  const res = NextResponse.json({ ok: true })
  // Clear both new and legacy cookies
  res.cookies.set("sessionId", "", { path: "/", maxAge: 0 })
  res.cookies.set("session", "", { path: "/", maxAge: 0 })
  return res
}