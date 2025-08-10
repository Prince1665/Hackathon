import Link from "next/link"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <main>
      <AppNav />
      <section className="container py-10">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold">HH302: Smart E‑Waste Management System</h1>
            <p className="text-muted-foreground">
              Report, track, and sustainably dispose of e‑waste on campus. QR‑code tagging, vendor pickup scheduling,
              compliance reports, and analytics included.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/report">Report an item</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin">Open Admin Dashboard</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/vendor/scan">Vendor Scan</Link>
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Report → Tag with QR → Schedule pickup → Vendor collection → Final disposal</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
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
