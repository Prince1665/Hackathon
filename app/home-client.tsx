"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

type Session = {
  user: {
    user_id: string
    name: string
    email: string
    role: string
    department_id: number | null
  }
} | null

export function HomePageClient() {
  const [session, setSession] = useState<Session>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session client-side
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data.session || null)
      })
      .catch(() => {
        setSession(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-4 max-w-4xl mx-auto">
        {/* Show all buttons while loading */}
        <Button asChild className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white border-0 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild className="bg-[#9ac37e] hover:bg-[#8bb56f] text-white border-0 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Link href="/signup">Sign Up</Link>
        </Button>
        <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Link href="/report">Report an item</Link>
        </Button>
        <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Link href="/admin">Admin Dashboard</Link>
        </Button>
        <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Link href="/vendor/scan">Vendor Scan</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-4 max-w-4xl mx-auto">
      {!session ? (
        <>
          <Button asChild className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white border-0 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-[#9ac37e] hover:bg-[#8bb56f] text-white border-0 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </>
      ) : (
        <Button asChild className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white border-0 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Link href="/admin">Dashboard</Link>
        </Button>
      )}
      <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
        <Link href="/report">Report an item</Link>
      </Button>
      <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
        <Link href="/admin">Admin Dashboard</Link>
      </Button>
      <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
        <Link href="/vendor/scan">Vendor Scan</Link>
      </Button>
    </div>
  )
}
