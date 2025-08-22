import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Home } from "lucide-react"

export default function LoginLandingPage() {
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
      
      {/* Home icon in top left */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105 h-8 w-8 sm:h-10 sm:w-10"
          >
            <Home className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Link>
      </div>
      
      {/* Theme toggle in top right */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl relative z-10 mx-4">
        <Card className="border-[#9ac37e]/20 shadow-2xl backdrop-blur-sm bg-card/95 dark:bg-card/90">
          <CardHeader className="text-center">
            <CardTitle className="text-[#3e5f44] dark:text-[#9ac37e] text-xl sm:text-2xl font-bold">Login</CardTitle>
            <CardDescription className="text-[#3e5f44]/70 dark:text-[#9ac37e]/70 text-sm sm:text-base">Select your role to continue</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:p-6">
            <Button asChild className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white dark:bg-[#9ac37e] dark:hover:bg-[#8bb56f] dark:text-[#1a2e0a] py-3 text-base sm:text-lg font-semibold w-full">
              <Link href="/login/admin">Admin</Link>
            </Button>
            <Button asChild className="bg-[#9ac37e]/20 hover:bg-[#9ac37e]/30 text-[#3e5f44] border-[#9ac37e]/30 dark:bg-[#3e5f44]/20 dark:hover:bg-[#3e5f44]/30 dark:text-[#9ac37e] dark:border-[#3e5f44]/30 py-3 text-base sm:text-lg w-full">
              <Link href="/login/student">Student / Resident</Link>
            </Button>
            <Button asChild className="bg-[#9ac37e]/20 hover:bg-[#9ac37e]/30 text-[#3e5f44] border-[#9ac37e]/30 dark:bg-[#3e5f44]/20 dark:hover:bg-[#3e5f44]/30 dark:text-[#9ac37e] dark:border-[#3e5f44]/30 py-3 text-base sm:text-lg w-full">
              <Link href="/login/faculty">Faculty / Coordinator</Link>
            </Button>
            <Button asChild className="bg-white/20 hover:bg-white/30 text-[#3e5f44] border-[#9ac37e]/40 backdrop-blur-sm dark:bg-[#1a2e0a]/20 dark:hover:bg-[#1a2e0a]/30 dark:text-[#9ac37e] dark:border-[#9ac37e]/40 py-3 text-lg">
              <Link href="/login/vendor">E‑waste Vendor</Link>
            </Button>
            <div className="text-center mt-4 pt-4 border-t border-[#9ac37e]/20">
              <p className="text-sm text-[#3e5f44]/70 dark:text-[#9ac37e]/70">
                Don't have an account?{" "}
                <Link href="/signup" className="text-[#3e5f44] dark:text-[#9ac37e] font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}