import Link from "next/link"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/server/auth"

export default async function Page() {
  const session = await getSession()
  return (
    <main>
      <AppNav />

      {/* Hero - centered vertically and horizontally under the navbar */}
      <section className="relative bg-gradient-to-b from-emerald-50/70 to-transparent dark:from-emerald-900/20">
        <div className="container min-h-[calc(100svh-56px)] grid place-items-center py-16 md:py-24">
          <div className="max-w-3xl text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">SMART E WASTE MANAGEMENT SYSTEM</h1>
            <p className="text-muted-foreground text-lg">
              Residential complexes and campuses generate significant e‑waste: outdated computers, projectors, lab equipment,
              mobile devices, batteries, and accessories. Without awareness and proper tracking, much of it ends up in landfills.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {!session ? (
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
              ) : null}
              <Button asChild variant="secondary">
                <Link href="/report">Report an item</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin">Open Admin Dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/vendor/scan">Vendor Scan</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content - centered grid of cards */}
      <section className="container py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Why it matters</CardTitle>
              <CardDescription>
                Poor tracking and insufficient recycling infrastructure lead to environmental and health risks. Our platform fixes that.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              HH302 brings awareness, traceability, and compliance to e‑waste management with an end‑to‑end digital workflow.
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Everything you need for responsible e‑waste lifecycle management.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="rounded border p-3">
                <div className="font-medium">1. Centralized Portal</div>
                <div className="text-muted-foreground">Log, track, and manage disposal by department, category, age, and more.</div>
              </div>
              <div className="rounded border p-3">
                <div className="font-medium">2. QR Tagging</div>
                <div className="text-muted-foreground">Unique QR codes follow each item from reporting to final disposal.</div>
              </div>
              <div className="rounded border p-3">
                <div className="font-medium">3. Smart Scheduling</div>
                <div className="text-muted-foreground">Categorization and vendor pickup scheduling for efficient operations.</div>
              </div>
              <div className="rounded border p-3">
                <div className="font-medium">4. Compliance & Reporting</div>
                <div className="text-muted-foreground">CPCB/E‑Waste Rules aligned reporting for audits and traceability.</div>
              </div>
              <div className="rounded border p-3">
                <div className="font-medium">5. Engagement & Awareness</div>
                <div className="text-muted-foreground">Campaigns, challenges, and collection drives to boost participation.</div>
              </div>
              <div className="rounded border p-3">
                <div className="font-medium">6. Analytics Dashboard</div>
                <div className="text-muted-foreground">Trends, recovery rates, and environmental impact of recycling.</div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Report → Tag with QR → Schedule pickup → Vendor collection → Final disposal</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm md:text-base">
              <div>1. Students/Faculty report e‑waste and get a printable QR code.</div>
              <div>2. Item is stored at the department collection point.</div>
              <div>3. Admin categorizes and schedules a vendor pickup.</div>
              <div>4. Vendor scans QR on collection; status updates in real-time.</div>
              <div>5. Lifecycle recorded for compliance and analytics.</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
