import crypto from "node:crypto"
import { cookies } from "next/headers"
import { getUserByEmail, type User } from "./db"

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}

const SESSION_COOKIE = "session"

export type Session = {
  user: Pick<User, "user_id" | "name" | "email" | "role" | "department_id">
}

export async function signInWithPassword(email: string, password: string): Promise<Session | null> {
  const user = await getUserByEmail(email)
  if (!user || !user.password_hash) return null
  const hash = sha256(password)
  if (hash !== user.password_hash) return null
  const session: Session = {
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    },
  }
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return session
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Session
    return parsed
  } catch {
    return null
  }
}