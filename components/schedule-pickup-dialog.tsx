"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useEffect } from "react"

type Item = { id: string; name: string }
type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }

export function SchedulePickupDialog({
  items,
  selectedIds,
  vendors,
  onScheduled,
}: {
  items: Item[]
  selectedIds: string[]
  vendors: Vendor[]
  onScheduled: () => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [vendorId, setVendorId] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [adminId, setAdminId] = useState<string>("")

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      const s = await r.json()
      setAdminId(s?.user?.user_id || "")
    })
  }, [])

  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!vendorId || !date || selectedIds.length === 0) return
    setSubmitting(true)
    const res = await fetch("/api/pickups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        vendor_id: vendorId,
        admin_id: adminId || "unknown-admin",
        scheduled_date: date,
        item_ids: selectedIds,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setOpen(false)
      await onScheduled()
    } else {
      alert("Failed to schedule pickup")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={selectedIds.length === 0}>Schedule pickup</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule pickup</DialogTitle>
          <DialogDescription>Select vendor and date for {selectedIds.length} item(s).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.contact_person} ({v.company_name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!vendorId || !date || submitting}>
            {submitting ? "Scheduling..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
