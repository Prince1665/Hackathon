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
  disposition?: "Recyclable" | "Reusable" | "Hazardous" | null
}

type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }

export default function Page() {
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [disp, setDisp] = useState<string>("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [volumeTrends, setVolumeTrends] = useState<{ month: string; count: number }[]>([])
  const [catDist, setCatDist] = useState<{ category: string; count: number }[]>([])
  const [recovery, setRecovery] = useState<{ rate: number; recycled: number; disposed: number } | null>(null)

  async function load() {
    const qs = new URLSearchParams()
    if (status) qs.set("status", status)
    if (category) qs.set("category", category)
    if (disp) qs.set("disposition", disp as any)
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
  }, [status, category, disp])

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
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Collected">Collected</SelectItem>
                      <SelectItem value="Safely Disposed">Safely Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={disp} onValueChange={setDisp}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by disposition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recyclable">Recyclable</SelectItem>
                      <SelectItem value="Reusable">Reusable</SelectItem>
                      <SelectItem value="Hazardous">Hazardous</SelectItem>
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
                  <Button variant="outline" onClick={() => { setQ(""); setStatus(""); setCategory(""); setDisp(""); }}>Reset filters</Button>
                </div>
                <div className="border rounded-md">
                  <div className="grid grid-cols-[24px_200px_1fr_120px_140px_120px_120px] gap-3 px-3 py-2 text-xs text-muted-foreground">
                    <div />
                    <div>ID</div>
                    <div>Name</div>
                    <div>Category</div>
                    <div>Disposition</div>
                    <div>Status</div>
                    <div>Reported</div>
                  </div>
                  <Separator />
                  <div className="max-h-[420px] overflow-auto divide-y">
                    {filtered.map((i) => (
                      <div key={i.id} className="grid grid-cols-[24px_200px_1fr_120px_140px_120px_120px] gap-3 items-center px-3 py-3">
                        <Checkbox checked={!!selected[i.id]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: !!v }))} aria-label="Select row" />
                        <div className="text-xs text-muted-foreground truncate">{i.id}</div>
                        <div className="truncate font-medium">{i.name}</div>
                        <div><Badge variant="secondary">{i.category}</Badge></div>
                        <div>{i.disposition ? <Badge variant="outline">{i.disposition}</Badge> : <span className="text-muted-foreground">—</span>}</div>
                        <div><Badge>{i.status}</Badge></div>
                        <div className="text-xs">{new Date(i.reported_date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

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
            <CampaignsSection />
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
    const qs = new URLSearchParams()
    if (from) qs.set("from", from)
    if (to) qs.set("to", to)
    const res = await fetch(`/api/reports/summary?${qs.toString()}`)
    const summary = await res.json()

    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("E‑Waste Compliance Report", 14, 20)
    doc.setFontSize(10)
    doc.text(`Date range: ${summary.from || "—"} to ${summary.to || "—"}`, 14, 28)
    doc.setFontSize(12)
    doc.text("By Status:", 14, 40)
    const s = summary.byStatus
    let y = 46
    for (const k of Object.keys(s)) {
      doc.text(`${k}: ${s[k]}`, 18, y)
      y += 6
    }
    y += 4
    doc.text("By Category:", 14, y)
    y += 6
    const c = summary.byCategory
    for (const k of Object.keys(c)) {
      doc.text(`${k}: ${c[k]}`, 18, y)
      y += 6
    }
    y += 6
    doc.setFontSize(10)
    doc.text("Generated by SMART E WASTE MANAGEMENT SYSTEM", 14, y)
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


function CampaignsSection() {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const [rows, setRows] = useState<Array<{ id: string; title: string; date: string; description?: string }>>([])

  async function load() {
    const r = await fetch("/api/campaigns")
    setRows(await r.json())
  }

  useEffect(() => {
    load()
  }, [])

  async function create() {
    if (!title || !date) return
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, date, description }),
    })
    if (res.ok) {
      setTitle("")
      setDate("")
      setDescription("")
      await load()
    } else {
      alert("Failed to create campaign")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaigns</CardTitle>
        <CardDescription>Announce collection drives, challenges, and awareness events.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Campus E‑Waste Drive" />
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief details or rules" />
          </div>
          <div>
            <Button onClick={create} disabled={!title || !date}>Create</Button>
          </div>
        </div>
        <div className="rounded border">
          <div className="grid grid-cols-[1fr_140px] gap-3 px-3 py-2 text-xs text-muted-foreground">
            <div>Title & Description</div>
            <div>Date</div>
          </div>
          <Separator />
          <div className="divide-y max-h-[320px] overflow-auto">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_140px] gap-3 items-center px-3 py-2">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.description || "—"}</div>
                </div>
                <div className="text-sm">{new Date(r.date).toLocaleDateString()}</div>
              </div>
            ))}
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground px-3 py-4">No campaigns yet.</div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
