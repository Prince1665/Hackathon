const crypto = require("node:crypto")
import { cookies } from "next/headers"
import { getSessionById, getUserByEmail, getUserById } from "./auth-mongo"

// Minimal local User shape (legacy stub)
export type User = {
  user_id: string
  name: string
  email: string
  role: string
  department_id: number | null
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex")
}

const SESSION_COOKIE = "session"           // legacy JSON session
const SESSION_ID_COOKIE = "sessionId"      // Mongo session id

export type Session = {
  user: Pick<User, "user_id" | "name" | "email" | "role" | "department_id">
}

export async function signInWithPassword(email: string, password: string): Promise<Session | null> {
  try {
    if (!email || !password) {
      console.error("Missing email or password")
      return null
    }

    const user = await getUserByEmail(email)
    if (!user || !user.passwordHash) {
      console.error("User not found or no password hash")
      return null
    }
    
    const hash = sha256(password)
    if (hash !== user.passwordHash) {
      console.error("Password mismatch")
      return null
    }
    
    const session: Session = {
      user: {
        user_id: String(user._id),
        name: user.name || "",
        email: user.email,
        role: user.role || "student",
        department_id: user.department_id || null,
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
  } catch (error) {
    console.error("Error in signInWithPassword:", error)
    return null
  }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
  cookieStore.set(SESSION_ID_COOKIE, "", { path: "/", maxAge: 0 })
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    
    // Prefer Mongo-backed sessionId cookie
    const sid = cookieStore.get(SESSION_ID_COOKIE)?.value
    if (sid) {
      try {
        const s = await getSessionById(sid)
        if (s) {
          // Load user details to include email and name
          const u = await getUserById(String(s.userId)).catch(() => null as any)
          if (u) {
            return { 
              user: { 
                user_id: String(s.userId), 
                name: u.name || "", 
                email: u.email || "", 
                role: (u.role || s.role) as any, 
                department_id: (u.department_id ?? 0) as any 
              } as any 
            }
          }
        }
      } catch (error) {
        console.error("Error getting session from database:", error)
        // Don't throw, fallback to legacy session
      }
    }
    
    // Fallback to legacy JSON session cookie
    const raw = cookieStore.get(SESSION_COOKIE)?.value
    if (!raw) return null
    
    try {
      const parsed = JSON.parse(raw) as Session
      // Validate session structure
      if (parsed?.user?.user_id && parsed?.user?.email) {
        return parsed
      }
      return null
    } catch (error) {
      console.error("Error parsing session cookie:", error)
      return null
    }
  } catch (error) {
    console.error("Error in getSession:", error)
    return null
  }
}