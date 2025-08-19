import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SignupLandingPage() {
  return (
    <main className="min-h-[100svh] grid place-items-center p-4 relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/ewaste-bg.jpg')`
        }}
      ></div>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d5016]/80 via-[#3e5f44]/70 to-[#1a2e0a]/80"></div>
      
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl relative z-10">
        <Card className="border-[#9ac37e]/20 shadow-2xl backdrop-blur-sm bg-card/95 dark:bg-card/90">
          <CardHeader>
            <CardTitle className="text-[#3e5f44] dark:text-[#9ac37e] text-2xl font-bold">Sign Up</CardTitle>
            <CardDescription className="text-[#3e5f44]/70 dark:text-[#9ac37e]/70">Create your account - Select your role to continue</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="bg-[#9ac37e]/20 hover:bg-[#9ac37e]/30 text-[#3e5f44] border-[#9ac37e]/30 dark:bg-[#3e5f44]/20 dark:hover:bg-[#3e5f44]/30 dark:text-[#9ac37e] dark:border-[#3e5f44]/30 py-3 text-lg">
              <Link href="/signup/student">Student / Resident</Link>
            </Button>
            <Button asChild className="bg-[#9ac37e]/20 hover:bg-[#9ac37e]/30 text-[#3e5f44] border-[#9ac37e]/30 dark:bg-[#3e5f44]/20 dark:hover:bg-[#3e5f44]/30 dark:text-[#9ac37e] dark:border-[#3e5f44]/30 py-3 text-lg">
              <Link href="/signup/faculty">Faculty / Coordinator</Link>
            </Button>
            <Button asChild className="bg-white/20 hover:bg-white/30 text-[#3e5f44] border-[#9ac37e]/40 backdrop-blur-sm dark:bg-[#1a2e0a]/20 dark:hover:bg-[#1a2e0a]/30 dark:text-[#9ac37e] dark:border-[#9ac37e]/40 py-3 text-lg">
              <Link href="/signup/vendor">E‑waste Vendor</Link>
            </Button>
            <div className="text-center mt-4 pt-4 border-t border-[#9ac37e]/20">
              <p className="text-sm text-[#3e5f44]/70 dark:text-[#9ac37e]/70">
                Already have an account?{" "}
                <Link href="/login" className="text-[#3e5f44] dark:text-[#9ac37e] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
