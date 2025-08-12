"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") || "" : ""

  return (
    <main className="min-h-[100svh] grid place-items-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Use your admin credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/login" method="post" className="grid gap-4">
              <input type="hidden" name="from" value={from} />
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}