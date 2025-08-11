import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createUser, getUserByEmail, type Role } from "@/lib/server/db"
import { sha256 } from "@/lib/server/auth"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  const { name, email, password, role, department_id } = body as {
    name?: string
    email?: string
    password?: string
    role?: Role
    department_id?: number | null
  }
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  if (!["student", "coordinator", "vendor"].includes(role)) {
    return NextResponse.json({ error: "Unsupported role for self-signup" }, { status: 400 })
  }
  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 })
  }
  const user = await createUser({
    name,
    email,
    password_hash: sha256(password),
    role,
    department_id: role === "vendor" ? null : department_id ?? null,
  })
  const cookieStore = await cookies()
  cookieStore.set("signup_done", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
  return NextResponse.json({ user })
}