import Link from "next/link"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession } from "@/lib/server/auth"
import { listCampaigns } from "@/lib/server/data-mongo"

export default async function Page() {
  const session = await getSession()
  const campaigns = await listCampaigns()
  const now = new Date()
  const upcoming = campaigns
    .filter((c) => {
      const d = new Date(c.date)
      // Only keep future or today
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6)
  return (
    <main>
      <AppNav />

      {/* Hero - centered vertically and horizontally under the navbar with e-waste background */}
      <section className="relative min-h-[calc(100svh-56px)] overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/ewaste-bg.jpg')`
          }}
        ></div>
        <div className="container min-h-[calc(100svh-56px)] grid place-items-center py-16 md:py-24">
          <div className="max-w-4xl text-center space-y-8">
            {/* Theme toggle for home screen */}
            <div className="absolute top-4 right-4 z-20">
              <ThemeToggle />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-2xl relative z-10 px-4">
              SMART E-WASTE MANAGEMENT
            </h1>
            <p className="text-white text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto drop-shadow-lg relative z-10 px-4">
              Residential complexes and campuses generate significant e‑waste: outdated computers, projectors, lab equipment,
              mobile devices, batteries, and accessories. Without awareness and proper tracking, much of it ends up in landfills.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-4 px-4">
              {!session ? (
                <>
                  <Button asChild className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white border-0 px-4 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl relative z-10 w-full sm:w-auto">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="bg-[#9ac37e] hover:bg-[#8bb56f] text-white border-0 px-4 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl relative z-10 w-full sm:w-auto">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              ) : null}
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60 px-4 sm:px-8 py-3 text-base sm:text-lg font-medium rounded-lg transition-all duration-200 backdrop-blur-md shadow-lg hover:shadow-xl relative z-10 w-full sm:w-auto">
                <Link href="/report">Report an item</Link>
              </Button>
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60 px-4 sm:px-8 py-3 text-base sm:text-lg font-medium rounded-lg transition-all duration-200 backdrop-blur-md shadow-lg hover:shadow-xl relative z-10 w-full sm:w-auto">
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-white/40 hover:border-white/60 px-4 sm:px-8 py-3 text-base sm:text-lg font-medium rounded-lg transition-all duration-200 backdrop-blur-md shadow-lg hover:shadow-xl relative z-10 w-full sm:w-auto">
                <Link href="/vendor/scan">Vendor Scan</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content - centered grid of cards with enhanced styling */}
      <section className="container py-12 md:py-16 bg-gradient-to-b from-[#9ac37e]/10 to-transparent">
        <div className="grid gap-6 md:grid-cols-3">
          {upcoming.length > 0 && (
            <Card className="md:col-span-3 border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-[#9ac37e]/5 to-transparent">
                <CardTitle className="text-[#3e5f44] text-xl font-bold">Upcoming campaigns</CardTitle>
                <CardDescription className="text-[#3e5f44]/70">Open awareness drives and collection events visible to everyone.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((c) => (
                    <li key={c.id} className="rounded-lg border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 hover:to-[#9ac37e]/5 transition-all duration-200 hover:shadow-md">
                      <div className="text-sm text-[#3e5f44]/70 font-medium">{new Date(c.date).toLocaleDateString()}</div>
                      <div className="font-semibold text-[#3e5f44] mt-1">{c.title}</div>
                      {c.description ? (
                        <div className="text-sm text-[#3e5f44]/60 line-clamp-3 mt-2">{c.description}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-1 border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <CardHeader className="bg-gradient-to-br from-[#9ac37e]/10 to-[#9ac37e]/5">
              <CardTitle className="text-[#3e5f44] text-lg font-bold">Why it matters</CardTitle>
              <CardDescription className="text-[#3e5f44]/70">
                Poor tracking and insufficient recycling infrastructure lead to environmental and health risks. Our platform fixes that.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[#3e5f44]/80 leading-relaxed">
              HH302 brings awareness, traceability, and compliance to e‑waste management with an end‑to‑end digital workflow.
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-[#9ac37e]/5 to-transparent">
              <CardTitle className="text-[#3e5f44] text-lg font-bold">Features</CardTitle>
              <CardDescription className="text-[#3e5f44]/70">Everything you need for responsible e‑waste lifecycle management.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 transition-all duration-200 hover:shadow-sm">
                <div className="font-semibold text-[#3e5f44]">1. Centralized Portal</div>
                <div className="text-[#3e5f44]/70 mt-1">Log, track, and manage disposal by department, category, age, and more.</div>
              </div>
              <div className="rounded-lg border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 transition-all duration-200 hover:shadow-sm">
                <div className="font-semibold text-[#3e5f44]">2. QR Tagging</div>
                <div className="text-[#3e5f44]/70 mt-1">Unique QR codes follow each item from reporting to final disposal.</div>
              </div>
              <div className="rounded-lg border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 transition-all duration-200 hover:shadow-sm">
                <div className="font-semibold text-[#3e5f44]">3. Smart Scheduling</div>
                <div className="text-[#3e5f44]/70 mt-1">Categorization and vendor pickup scheduling for efficient operations.</div>
              </div>
              <div className="rounded-lg border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 transition-all duration-200 hover:shadow-sm">
                <div className="font-semibold text-[#3e5f44]">4. Compliance & Reporting</div>
                <div className="text-[#3e5f44]/70 mt-1">CPCB/E‑Waste Rules aligned reporting for audits and traceability.</div>
              </div>
              <div className="rounded-lg border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 transition-all duration-200 hover:shadow-sm">
                <div className="font-semibold text-[#3e5f44]">5. Engagement & Awareness</div>
                <div className="text-[#3e5f44]/70 mt-1">Campaigns, challenges, and collection drives to boost participation.</div>
              </div>
              <div className="rounded-lg border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 transition-all duration-200 hover:shadow-sm">
                <div className="font-semibold text-[#3e5f44]">6. Analytics Dashboard</div>
                <div className="text-[#3e5f44]/70 mt-1">Trends, recovery rates, and environmental impact of recycling.</div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-[#9ac37e]/5 to-transparent">
              <CardTitle className="text-[#3e5f44] text-xl font-bold">How it works</CardTitle>
              <CardDescription className="text-[#3e5f44]/70 text-base">Report → Tag with QR → Schedule pickup → Vendor collection → Final disposal</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:text-base">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#9ac37e]/10 to-transparent border-l-4 border-[#3e5f44] hover:from-[#9ac37e]/15 transition-all duration-200">
                <span className="flex-shrink-0 w-8 h-8 bg-[#3e5f44] text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <span className="text-[#3e5f44]">Students/Faculty report e‑waste and get a printable QR code.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#9ac37e]/10 to-transparent border-l-4 border-[#3e5f44] hover:from-[#9ac37e]/15 transition-all duration-200">
                <span className="flex-shrink-0 w-8 h-8 bg-[#3e5f44] text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <span className="text-[#3e5f44]">Item is stored at the department collection point.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#9ac37e]/10 to-transparent border-l-4 border-[#3e5f44] hover:from-[#9ac37e]/15 transition-all duration-200">
                <span className="flex-shrink-0 w-8 h-8 bg-[#3e5f44] text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <span className="text-[#3e5f44]">Admin categorizes and schedules a vendor pickup.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#9ac37e]/10 to-transparent border-l-4 border-[#3e5f44] hover:from-[#9ac37e]/15 transition-all duration-200">
                <span className="flex-shrink-0 w-8 h-8 bg-[#3e5f44] text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <span className="text-[#3e5f44]">Vendor scans QR on collection; status updates in real-time.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#9ac37e]/10 to-transparent border-l-4 border-[#3e5f44] hover:from-[#9ac37e]/15 transition-all duration-200">
                <span className="flex-shrink-0 w-8 h-8 bg-[#3e5f44] text-white rounded-full flex items-center justify-center font-bold text-sm">5</span>
                <span className="text-[#3e5f44]">Lifecycle recorded for compliance and analytics.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
