"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Role = "student" | "coordinator" | "admin" | "vendor"

type SessionState = { user: null | { role: Role }; signupDone: boolean; loading: boolean }

export function AppNav({ className }: { className?: string }) {
  const [role, setRole] = useState<Role>("student")
  const [session, setSession] = useState<SessionState>({ user: null, signupDone: false, loading: true })

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("role") as Role | null) : null
    if (saved) setRole(saved)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("role", role)
    }
  }, [role])

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/session").then(async (r) => {
      const data = await r.json()
      if (!cancelled) setSession({ user: data.user, signupDone: !!data.signupDone, loading: false })
    }).catch(() => setSession((s) => ({ ...s, loading: false })))
    return () => { cancelled = true }
  }, [])

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    if (typeof window !== "undefined") window.location.href = "/"
  }

  return (
    <header className={cn("w-full border-b bg-background", className)}>
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            HH302 E‑Waste
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/report" className="hover:text-foreground">
              Report item
            </Link>
            <Link href="/admin" className={cn("hover:text-foreground", role !== "admin" && "opacity-60")}>
              Admin
            </Link>
            <Link href="/vendor/scan" className={cn("hover:text-foreground", role !== "vendor" && "opacity-60")}>
              Vendor scan
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Select value={role} onValueChange={(v: Role) => setRole(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student/Resident</SelectItem>
              <SelectItem value="coordinator">Coordinator/Faculty</SelectItem>
              <SelectItem value="admin">System Admin</SelectItem>
              <SelectItem value="vendor">E‑Waste Vendor</SelectItem>
            </SelectContent>
          </Select>
          {!session.loading && (
            <>
              {session.user ? (
                // Logged in: show only Logout
                <Button size="sm" variant="ghost" onClick={onLogout}>
                  Logout
                </Button>
              ) : (
                // Logged out
                <>
                  {!session.signupDone && (
                    <Button asChild size="sm" variant="secondary">
                      <Link href="/signup">Sign up</Link>
                    </Button>
                  )}
                  <Button asChild size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
