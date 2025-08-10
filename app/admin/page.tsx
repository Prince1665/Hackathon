"use client"

import { useEffect, useMemo, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SchedulePickupDialog } from "@/components/schedule-pickup-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

type Item = {
  id: string
  name: string
  description?: string
  category: "Laptop" | "Monitor" | "Battery" | "Other"
  status: string
  department_id: number
  reported_by: string
  reported_date: string
}

type Vendor = { id: string; company_name: string }

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [volumeTrends, setVolumeTrends] = useState<{ month: string; count: number }[]>([])
  const [catDist, setCatDist] = useState<{ category: string; count: number }[]>([])
  const [recovery, setRecovery] = useState<{ rate: number; recycled: number; disposed: number } | null>(null)

  async function load() {
    const qs = new URLSearchParams()
    if (status) qs.set("status", status)
    if (category) qs.set("category", category)
    const res = await fetch(`/api/items?${qs.toString()}`)
    setItems(await res.json())
  }

  useEffect(() => {
    load()
    fetch("/api/vendors").then(async (r) => setVendors(await r.json()))
    fetch("/api/analytics/volume-trends").then(async (r) => setVolumeTrends(await r.json()))
    fetch("/api/analytics/category-distribution").then(async (r) => setCatDist(await r.json()))
    fetch("/api/analytics/recovery-rate").then(async (r) => setRecovery(await r.json()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category])

  const filtered = useMemo(() => {
    if (!q) return items
    const qq = q.toLowerCase()
    return items.filter((i) => [i.name, i.description, i.id, i.reported_by].filter(Boolean).join(" ").toLowerCase().includes(qq))
  }, [items, q])

  const selectable = filtered.filter((i) => i.status === "Awaiting Pickup" || i.status === "Reported")

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected])

  return (
    <main>
      <AppNav />
      <section className="container py-8 space-y-8">
        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Pickup</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All e‑waste items</CardTitle>
                <CardDescription>Search, filter and manage items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <Input placeholder="Search by name, id, reporter..." value={q} onChange={(e) => setQ(e.target.value)} className="md:w-[280px]" />
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reported">Reported</SelectItem>
                      <SelectItem value="Awaiting Pickup">Awaiting Pickup</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Collected">Collected</SelectItem>
                      <SelectItem value="Recycled">Recycled</SelectItem>
                      <SelectItem value="Refurbished">Refurbished</SelectItem>
                      <SelectItem value="Safely Disposed">Safely Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Monitor">Monitor</SelectItem>
                      <SelectItem value="Battery">Battery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-md">
                  <div className="grid grid-cols-[24px_1fr_120px_140px_160px] gap-3 px-3 py-2 text-xs text-muted-foreground">
                    <div />
                    <div>Name</div>
                    <div>Category</div>
                    <div>Status</div>
                    <div>Reported</div>
                  </div>
                  <Separator />
                  <div className="max-h-[420px] overflow-auto divide-y">
                    {filtered.map((i) => (
                      <div key={i.id} className="grid grid-cols-[24px_1fr_120px_140px_160px] gap-3 items-center px-3 py-3">
                        <Checkbox checked={!!selected[i.id]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: !!v }))} aria-label="Select row" />
                        <div className="truncate">
                          <div className="font-medium">{i.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{i.id}</div>
                        </div>
                        <div><Badge variant="secondary">{i.category}</Badge></div>
                        <div><Badge>{i.status}</Badge></div>
                        <div className="text-xs">{new Date(i.reported_date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule pickup</CardTitle>
                <CardDescription>Select items with status Reported/Awaiting Pickup and assign a vendor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Selected items: {selectedIds.length} / Eligible: {selectable.length}
                </div>
                <SchedulePickupDialog
                  items={selectable}
                  selectedIds={selectedIds}
                  vendors={vendors}
                  onScheduled={async () => {
                    setSelected({})
                    await load()
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KPIs</CardTitle>
                <CardDescription>High-level performance indicators.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Recovery rate</div>
                  <div className="text-2xl font-bold">{recovery ? `${recovery.rate}%` : "—"}</div>
                  <div className="text-xs text-muted-foreground">Recycled: {recovery?.recycled ?? 0} · Disposed: {recovery?.disposed ?? 0}</div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Total items</div>
                  <div className="text-2xl font-bold">{items.length}</div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Active vendors</div>
                  <div className="text-2xl font-bold">{vendors.length}</div>
                </div>
              </CardContent>
            </Card>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {volumeTrends.map((v) => (
                      <li key={v.month} className="flex items-center gap-3">
                        <span className="w-20">{v.month}</span>
                        <div className="h-2 bg-muted rounded w-full">
                          <div className="h-2 bg-emerald-500 rounded" style={{ width: `${Math.min(100, v.count * 10)}%` }} />
                        </div>
                        <span className="w-8 text-right">{v.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Category distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {catDist.map((c) => (
                      <li key={c.category} className="flex items-center justify-between">
                        <span>{c.category}</span>
                        <Badge variant="secondary">{c.count}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ReportsSection />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>Post announcements or challenges. (Stub for now)</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Coming soon: create collection drives, inter-department leaderboards, point incentives.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}

function ReportsSection() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  async function downloadPdf() {
    // Simple client-side PDF as a demo; replace with server-generated report later if needed.
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("E‑Waste Compliance Report", 14, 20)
    doc.setFontSize(10)
    doc.text(`Date range: ${from || "—"} to ${to || "—"}`, 14, 28)
    doc.text("This is a sample PDF. Integrate ReportLab/FPDF server-side for CPCB Form‑2/Form‑3 compliance.", 14, 36)
    doc.save("ewaste-report.pdf")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance reports</CardTitle>
        <CardDescription>Generate CPCB aligned reports (demo PDF here).</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-[180px_180px_auto] gap-3">
        <div className="grid gap-2">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={downloadPdf}>Download PDF</Button>
        </div>
      </CardContent>
    </Card>
  )
}
