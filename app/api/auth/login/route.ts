import { NextResponse } from "next/server"
import { signInWithPassword } from "@/lib/server/auth"

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }))
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }
  const session = await signInWithPassword(email, password)
  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  return NextResponse.json({ user: session.user })
}