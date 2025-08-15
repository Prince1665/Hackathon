"use client"

import { useEffect, useMemo, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import QRCode from "qrcode"

type Department = { id: number; name: string; location: string }
type Item = {
  id: string
  name: string
  description?: string
  category: string
  department_id: number
  reported_by: string
  qr_code_url: string
}

export default function ReportPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Laptop",
    department_id: "",
    reported_by: "",
    disposition: "",
  })
  const [created, setCreated] = useState<Item | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/departments").then(async (r) => setDepartments(await r.json()))
    // Autofill reporter email if logged in
    fetch("/api/auth/session").then(async (r) => {
      const s = await r.json().catch(() => null)
      const email = s?.user?.email || ""
      if (email) setForm((f) => (f.reported_by ? f : { ...f, reported_by: email }))
    }).catch(() => {})
  }, [])

  const canSubmit = useMemo(() => {
    return form.name && form.category && form.department_id && form.reported_by
  }, [form])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        department_id: Number(form.department_id),
        reported_by: form.reported_by,
        disposition: form.disposition || undefined,
      }),
    })
    if (!res.ok) {
      alert("Failed to create item")
      return
    }
    const item: Item = await res.json()
    setCreated(item)
    // Generate QR code with just the item ID instead of full URL
    const dataUrl = await QRCode.toDataURL(item.id, { margin: 1, scale: 6 })
    setQrDataUrl(dataUrl)
  }

  return (
    <main>
      <AppNav />
      <section className="container py-4 sm:py-8 bg-gradient-to-b from-[#9ac37e]/5 to-transparent min-h-screen px-4">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-[#3e5f44] text-xl font-bold">Report e‑waste</CardTitle>
              <CardDescription className="text-[#3e5f44]/70">Fill in the details to generate a QR tag for this item.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Item name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Dell Latitude E5450" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Condition, asset tag, notes..." />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Monitor">Monitor</SelectItem>
                      <SelectItem value="Battery">Battery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Disposition</Label>
                  <Select value={form.disposition} onValueChange={(v) => setForm((f) => ({ ...f, disposition: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select disposition (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recyclable">Recyclable</SelectItem>
                      <SelectItem value="Reusable">Reusable</SelectItem>
                      <SelectItem value="Hazardous">Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reported_by">Your name or email</Label>
                  <Input id="reported_by" value={form.reported_by} onChange={(e) => setForm((f) => ({ ...f, reported_by: e.target.value }))} placeholder="e.g. alex@campus.edu" />
                </div>
                <Button type="submit" disabled={!canSubmit} className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white w-full sm:w-auto">Create & generate QR</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle>QR Tag</CardTitle>
              <CardDescription>Print and attach this QR to the item.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              {created ? (
                <>
                  <div className="text-center">
                    <div className="font-semibold">{created.name}</div>
                    <div className="text-muted-foreground text-sm">{created.category} · Dept #{created.department_id}</div>
                  </div>
                  {qrDataUrl ? (
                    <>
                      <img src={qrDataUrl || "/placeholder.svg"} alt="QR code for item" className="border rounded p-2 bg-white" />
                      <a href={qrDataUrl} download={`ewaste-${created.id}.png`} className="text-sm underline inline-block w-full sm:w-auto text-center sm:text-left">Download QR</a>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Generating QR...</div>
                  )}
                  <div className="text-sm text-muted-foreground">Item ID: {created.id}</div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">Submit the form to see the QR code here.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
