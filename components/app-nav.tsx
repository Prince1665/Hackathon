"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Gavel, BarChart3, FileText, Package, Truck } from "lucide-react"

type Role = "student" | "coordinator" | "admin" | "vendor"

export function AppNav({ className }: { className?: string }) {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [showBlocked, setShowBlocked] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      const s = await r.json()
      setRole(s?.user?.role ?? null)
    })
  }, [])

  function canAccess(path: string): boolean {
    // Everyone can access the public homepage
    if (path === "/") return true
    if (role === "admin") return true
    if (role === "vendor") return path.startsWith("/vendor") || path.startsWith("/auctions")
    if (role === "student" || role === "coordinator") {
      return path.startsWith("/report") || 
             path.startsWith("/auctions/my-auctions") || 
             path.startsWith("/item/")
    }
    return false
  }

  function go(path: string) {
    if (canAccess(path)) router.push(path)
    else setShowBlocked(true)
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    if (typeof window !== "undefined") window.location.href = "/"
  }

  return (
    <header className={cn("w-full border-b bg-background", className)}>
      <div className="container flex h-14 items-center justify-between gap-2 sm:gap-4 px-4">
        <div className="flex items-center gap-4">
          <a onClick={() => go("/")} className="font-semibold cursor-pointer text-center text-xs sm:text-sm md:text-base truncate">
            SMART E WASTE MANAGEMENT SYSTEM
          </a>
          
          {/* Role-based Navigation */}
          {role && (
            <nav className="hidden md:flex items-center gap-4">
              {(role === "student" || role === "coordinator") && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-sm">
                        Items <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => go("/report")}>
                        <Package className="h-4 w-4 mr-2" />
                        Report Items
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("/item/track")}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Track Items
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button variant="ghost" size="sm" onClick={() => go("/auctions/my-auctions")}>
                    <Gavel className="h-4 w-4 mr-2" />
                    My Auctions
                  </Button>
                </>
              )}
              
              {role === "vendor" && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => go("/vendor/scan")}>
                    <Truck className="h-4 w-4 mr-2" />
                    Pickups
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => go("/vendor/auctions")}>
                    <Gavel className="h-4 w-4 mr-2" />
                    Auctions
                  </Button>
                </>
              )}
              
              {role === "admin" && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => go("/admin")}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => go("/admin/auctions")}>
                    <Gavel className="h-4 w-4 mr-2" />
                    Auctions
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Menu for smaller screens */}
          {role && (
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Menu <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(role === "student" || role === "coordinator") && (
                    <>
                      <DropdownMenuItem onClick={() => go("/report")}>
                        <Package className="h-4 w-4 mr-2" />
                        Report Items
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("/auctions/my-auctions")}>
                        <Gavel className="h-4 w-4 mr-2" />
                        My Auctions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {role === "vendor" && (
                    <>
                      <DropdownMenuItem onClick={() => go("/vendor/scan")}>
                        <Truck className="h-4 w-4 mr-2" />
                        Pickups
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {role === "admin" && (
                    <>
                      <DropdownMenuItem onClick={() => go("/admin")}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => go("/admin/auctions")}>
                        <Gavel className="h-4 w-4 mr-2" />
                        Auctions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={onLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          <ThemeToggle />
          {role ? (
            <Button size="sm" variant="ghost" onClick={onLogout} className="hidden md:block text-xs sm:text-sm px-2 sm:px-3">
              Logout
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-xs sm:text-sm px-2 sm:px-3">
              <a href="/login">Login</a>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showBlocked} onOpenChange={setShowBlocked}>
        <DialogContent className="w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Feature unavailable</DialogTitle>
            <DialogDescription>
              You don't have access to this feature with your current role.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </header>
  )
}
