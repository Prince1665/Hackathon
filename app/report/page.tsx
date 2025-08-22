"use client"

import { useEffect, useMemo, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
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
  brand?: string
  build_quality?: number
  user_lifespan?: number
  usage_pattern?: "Light" | "Moderate" | "Heavy"
  expiry_years?: number
  condition?: number
  original_price?: number
  used_duration?: number
}

export default function ReportPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [brandOpen, setBrandOpen] = useState(false)
  
  const brands = [
    'HP', 'OnePlus', 'Lenovo', 'Sony', 'Samsung', 'Blue Star',
    'Daikin', 'LG', 'Morphy Richards', 'Voltas', 'Apple', 'IFB',
    'Vivo', 'Bosch', 'TCL', 'Acer', 'Huawei', 'Whirlpool', 'Panasonic',
    'Dell', 'Asus', 'Realme', 'Carrier', 'Xiaomi', 'Godrej'
  ]
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Tablet",
    department_id: "",
    reported_by: "",
    disposition: "",
    brand: "",
    build_quality: "",
    user_lifespan: "",
    usage_pattern: "",
    expiry_years: "",
    condition: "",
    original_price: "",
    used_duration: "",
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

  // Auto-fill expiry_years with user_lifespan
  useEffect(() => {
    if (form.user_lifespan && !form.expiry_years) {
      setForm(f => ({ ...f, expiry_years: f.user_lifespan }))
    }
  }, [form.user_lifespan, form.expiry_years])

  const canSubmit = useMemo(() => {
    // Check basic required fields
    if (!form.name || !form.category || !form.department_id || !form.reported_by) return false
    
    // Check that numeric fields are not negative
    const numericFields = [
      form.user_lifespan,
      form.expiry_years,
      form.original_price,
      form.used_duration
    ]
    
    for (const field of numericFields) {
      if (field && Number(field) < 0) return false
    }
    
    return true
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
        brand: form.brand || undefined,
        build_quality: form.build_quality || undefined,
        user_lifespan: form.user_lifespan || undefined,
        usage_pattern: form.usage_pattern || undefined,
        expiry_years: form.expiry_years || undefined,
        condition: form.condition || undefined,
        original_price: form.original_price || undefined,
        used_duration: form.used_duration || undefined,
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
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Microwave">Microwave</SelectItem>
                      <SelectItem value="Air Conditioner">Air Conditioner</SelectItem>
                      <SelectItem value="TV">TV</SelectItem>
                      <SelectItem value="Washing Machine">Washing Machine</SelectItem>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Smartphone">Smartphone</SelectItem>
                      <SelectItem value="Refrigerator">Refrigerator</SelectItem>
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
                  <Label>Brand</Label>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={brandOpen}
                        className="w-full justify-between"
                      >
                        {form.brand
                          ? brands.find((brand) => brand === form.brand)
                          : "Select brand..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search brand..." />
                        <CommandList>
                          <CommandEmpty>No brand found.</CommandEmpty>
                          <CommandGroup>
                            {brands.map((brand) => (
                              <CommandItem
                                key={brand}
                                value={brand}
                                onSelect={(currentValue) => {
                                  setForm((f) => ({ ...f, brand: currentValue === form.brand ? "" : currentValue }))
                                  setBrandOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.brand === brand ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {brand}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>Build Quality (1=Low, 5=High)</Label>
                  <Select value={form.build_quality} onValueChange={(v) => setForm((f) => ({ ...f, build_quality: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select build quality" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Low Quality</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good Quality</SelectItem>
                      <SelectItem value="5">5 - High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user_lifespan">User Lifespan (years)</Label>
                  <Input 
                    id="user_lifespan" 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={form.user_lifespan} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, user_lifespan: value }))
                      }
                    }} 
                    placeholder="e.g. 3.5" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Usage Pattern</Label>
                  <Select value={form.usage_pattern} onValueChange={(v) => setForm((f) => ({ ...f, usage_pattern: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select usage pattern" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Light">Light</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry_years">Expiry Years</Label>
                  <Input 
                    id="expiry_years" 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={form.expiry_years} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, expiry_years: value }))
                      }
                    }} 
                    placeholder="Auto-filled from user lifespan or enter manually" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Condition (1=Poor, 5=Excellent)</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor Condition</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good Condition</SelectItem>
                      <SelectItem value="5">5 - Excellent Condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="original_price">Original Price (₹)</Label>
                  <Input 
                    id="original_price" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={form.original_price} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, original_price: value }))
                      }
                    }} 
                    placeholder="e.g. 50000.00" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="used_duration">Used Duration (years)</Label>
                  <Input 
                    id="used_duration" 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={form.used_duration} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, used_duration: value }))
                      }
                    }} 
                    placeholder="e.g. 2.5" 
                  />
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
