"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppNav } from "@/components/app-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SchedulePickupDialog } from "@/components/schedule-pickup-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Item = {
  id: string
  name: string
  description?: string
  category: "Tablet" | "Microwave" | "Air Conditioner" | "TV" | "Washing Machine" | "Laptop" | "Smartphone" | "Refrigerator"
  status: string
  department_id: number
  reported_by: string
  reported_date: string
  disposition?: "Recyclable" | "Reusable" | "Hazardous" | null
  brand?: string
  build_quality?: number
  user_lifespan?: number
  usage_pattern?: "Light" | "Moderate" | "Heavy"
  expiry_years?: number
  condition?: number
  original_price?: number
  used_duration?: number
  current_price?: number
  predicted_price?: number
  price_confirmed?: boolean
}

type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }

export default function Page() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  
  // Helper function to display category with better names
  const displayCategory = (category: string) => {
    return category === "TV" ? "TV / Monitor" : category
  }
  
  // Helper function to display price
  const displayPrice = (item: Item) => {
    const currentPrice = item.current_price || 0;
    const predictedPrice = item.predicted_price || 0;
    
    // If no price at all, show zero
    if (!currentPrice && !predictedPrice) {
      return <div className="text-xs">₹0</div>;
    }
    
    return (
      <div className="text-right">
        <div className="text-xs font-medium truncate">₹{currentPrice.toLocaleString()}</div>
        {predictedPrice > 0 && predictedPrice !== currentPrice && (
          <div className="text-[8px] text-gray-500 truncate">
            ML predicted: ₹{predictedPrice.toLocaleString()}
          </div>
        )}
      </div>
    );
  }
  const [disp, setDisp] = useState<string>("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [vendors, setVendors] = useState<Vendor[]>([])
    const [adminPickups, setAdminPickups] = useState<Array<{ 
    id: string; 
    scheduled_date: string; 
    status: string; 
    vendor_response?: string | null; 
    vendor_response_date?: string | null;
    vendor_response_note?: string | null;
    vendor: { name: string; company: string; email: string; cpcb_registration_no: string };
    items: Array<{ id: string; name: string; category: "Tablet" | "Microwave" | "Air Conditioner" | "TV" | "Washing Machine" | "Laptop" | "Smartphone" | "Refrigerator" }> 
  }>>([])
  const [volumeTrends, setVolumeTrends] = useState<{ month: string; count: number }[]>([])
  const [catDist, setCatDist] = useState<{ category: string; count: number }[]>([])
  const [recovery, setRecovery] = useState<{ rate: number; recycled: number; disposed: number } | null>(null)
  const [statusDist, setStatusDist] = useState<{ status: string; count: number; percentage: string }[]>([])
  const [dispositionDist, setDispositionDist] = useState<{ disposition: string; count: number; percentage: string }[]>([])
  const [itemsByDate, setItemsByDate] = useState<{ date: string; count: number; formattedDate: string }[]>([])

  // Chart colors
  const CHART_COLORS = ['#3e5f44', '#9ac37e', '#6b8f71', '#a8d18a', '#4a6e50', '#7ca67f', '#8fb585']

  async function load() {
    const qs = new URLSearchParams()
    if (status) qs.set("status", status)
    if (category) qs.set("category", category)
    if (disp) qs.set("disposition", disp as any)
    const res = await fetch(`/api/items?${qs.toString()}`)
    const itemsData = await res.json()
    setItems(itemsData)
    
    // Also reload pickups to get updated vendor responses
    const pickupsRes = await fetch("/api/admin/pickups")
    if (pickupsRes.ok) {
      setAdminPickups(await pickupsRes.json())
    }
  }

  useEffect(() => {
    load()
    fetch("/api/vendors").then(async (r) => setVendors(await r.json()))
    fetch("/api/admin/pickups").then(async (r) => setAdminPickups(await r.json()))
    fetch("/api/analytics/volume-trends").then(async (r) => setVolumeTrends(await r.json()))
    fetch("/api/analytics/category-distribution").then(async (r) => setCatDist(await r.json()))
    fetch("/api/analytics/recovery-rate").then(async (r) => setRecovery(await r.json()))
    fetch("/api/analytics/status-distribution").then(async (r) => setStatusDist(await r.json()))
    fetch("/api/analytics/disposition-distribution").then(async (r) => setDispositionDist(await r.json()))
    fetch("/api/analytics/items-by-date").then(async (r) => setItemsByDate(await r.json()))
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

  const selectable = filtered.filter((i) => i.status === "Reported")

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected])

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
      <AppNav />
      <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 max-w-7xl">
        <Tabs defaultValue="items">
          <TabsList className="grid w-full grid-cols-2 grid-rows-3 md:grid-cols-5 md:grid-rows-1 gap-2 sm:gap-3 p-2 sm:p-3 bg-[#9ac37e]/10 rounded-none border-2 border-[#3e5f44] h-auto">
            <TabsTrigger value="items" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Items</TabsTrigger>
            <TabsTrigger value="pickups" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Pickups</TabsTrigger>
            <TabsTrigger value="analytics" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Analytics</TabsTrigger>
            <TabsTrigger value="reports" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Reports</TabsTrigger>
            <TabsTrigger value="campaigns" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-[#3e5f44] text-lg sm:text-xl font-bold">All e‑waste items</CardTitle>
                <CardDescription className="text-[#3e5f44]/70">Search, filter and manage items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input placeholder="Search by name, id, reporter..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full" />
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reported">Reported</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Collected">Collected</SelectItem>
                      <SelectItem value="Safely Disposed">Safely Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={disp} onValueChange={setDisp}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Filter by disposition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recyclable">Recyclable</SelectItem>
                      <SelectItem value="Reusable">Reusable</SelectItem>
                      <SelectItem value="Hazardous">Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Filter by category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Microwave">Microwave</SelectItem>
                      <SelectItem value="Air Conditioner">Air Conditioner</SelectItem>
                      <SelectItem value="TV">TV / Monitor</SelectItem>
                      <SelectItem value="Washing Machine">Washing Machine</SelectItem>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Smartphone">Smartphone</SelectItem>
                      <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => { setQ(""); setStatus(""); setCategory(""); setDisp(""); }} className="border-[#9ac37e]/30 text-[#3e5f44] hover:bg-[#9ac37e]/10 w-full sm:w-auto">Reset filters</Button>
                </div>
                <div className="border rounded-md overflow-hidden">
                  {/* Desktop table view */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                      <table className="w-full min-w-[1400px] table-fixed border-separate border-spacing-0">
                        <thead className="sticky top-0 bg-muted/50 border-b z-10">
                          <tr>
                            <th className="w-[50px] px-3 py-3 text-xs font-medium text-muted-foreground text-center border-r border-border/30"></th>
                            <th className="w-[120px] px-3 py-3 text-xs font-medium text-muted-foreground text-left border-r border-border/30">ID</th>
                            <th className="w-[200px] px-3 py-3 text-xs font-medium text-muted-foreground text-left border-r border-border/30">Name</th>
                            <th className="w-[140px] px-3 py-3 text-xs font-medium text-muted-foreground text-left border-r border-border/30">Category</th>
                            <th className="w-[120px] px-3 py-3 text-xs font-medium text-muted-foreground text-left border-r border-border/30">Disposition</th>
                            <th className="w-[110px] px-3 py-3 text-xs font-medium text-muted-foreground text-left border-r border-border/30">Status</th>
                            <th className="w-[100px] px-3 py-3 text-xs font-medium text-muted-foreground text-left border-r border-border/30">Reported</th>
                            <th className="w-[110px] px-3 py-3 text-xs font-medium text-muted-foreground text-center border-r border-border/30">Build Quality</th>
                            <th className="w-[100px] px-3 py-3 text-xs font-medium text-muted-foreground text-center border-r border-border/30">Lifespan</th>
                            <th className="w-[100px] px-3 py-3 text-xs font-medium text-muted-foreground text-center border-r border-border/30">Usage</th>
                            <th className="w-[100px] px-3 py-3 text-xs font-medium text-muted-foreground text-center border-r border-border/30">Condition</th>
                            <th className="w-[140px] px-3 py-3 text-xs font-medium text-muted-foreground text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="text-center py-8 text-muted-foreground">
                                No items found matching your filters.
                              </td>
                            </tr>
                          ) : (
                            filtered.map((i) => (
                              <tr key={i.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="w-[50px] px-3 py-3 text-center border-r border-border/30">
                                  {i.status === "Reported" ? (
                                    <Checkbox 
                                      checked={!!selected[i.id]} 
                                      onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: !!v }))} 
                                      aria-label="Select row" 
                                    />
                                  ) : (
                                    <div className="w-4 h-4" />
                                  )}
                                </td>
                                <td className="w-[120px] px-3 py-3 border-r border-border/30">
                                  <div className="text-xs text-muted-foreground font-mono truncate overflow-hidden" title={i.id}>
                                    {i.id.slice(0, 10)}...
                                  </div>
                                </td>
                                <td className="w-[200px] px-3 py-3 border-r border-border/30">
                                  <div className="truncate font-medium text-sm overflow-hidden" title={i.name}>
                                    {i.name}
                                  </div>
                                </td>
                                <td className="w-[140px] px-3 py-3 border-r border-border/30">
                                  <div className="flex">
                                    <Badge variant="secondary" className="text-xs truncate max-w-full">
                                      {displayCategory(i.category)}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="w-[120px] px-3 py-3 border-r border-border/30">
                                  <div className="flex">
                                    {i.disposition ? (
                                      <Badge variant="outline" className="text-xs truncate max-w-full">
                                        {i.disposition}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="w-[110px] px-3 py-3 border-r border-border/30">
                                  <div className="flex">
                                    <Badge className="text-xs truncate max-w-full">
                                      {i.status}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="w-[100px] px-3 py-3 border-r border-border/30">
                                  <div className="text-xs overflow-hidden">
                                    {new Date(i.reported_date).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="w-[110px] px-3 py-3 text-center border-r border-border/30">
                                  <div className="text-xs overflow-hidden">
                                    {i.build_quality || "—"}
                                  </div>
                                </td>
                                <td className="w-[100px] px-3 py-3 text-center border-r border-border/30">
                                  <div className="text-xs overflow-hidden">
                                    {i.user_lifespan ? `${i.user_lifespan}y` : "—"}
                                  </div>
                                </td>
                                <td className="w-[100px] px-3 py-3 text-center border-r border-border/30">
                                  <div className="text-xs overflow-hidden">
                                    {i.usage_pattern || "—"}
                                  </div>
                                </td>
                                <td className="w-[100px] px-3 py-3 text-center border-r border-border/30">
                                  <div className="text-xs overflow-hidden">
                                    {i.condition || "—"}
                                  </div>
                                </td>
                                <td className="w-[140px] px-3 py-3 text-right">
                                  <div className="overflow-hidden">
                                    {displayPrice(i)}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Mobile card view */}
                  <div className="lg:hidden">
                    <div className="max-h-[420px] overflow-auto">
                      {filtered.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No items found matching your filters.
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {filtered.map((i) => (
                            <div key={i.id} className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  {i.status === "Reported" ? (
                                    <Checkbox 
                                      checked={!!selected[i.id]} 
                                      onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: !!v }))} 
                                      aria-label="Select row"
                                      className="mt-1"
                                    />
                                  ) : (
                                    <div className="w-4 h-4 mt-1" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{i.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      ID: {i.id.slice(0, 12)}...
                                    </div>
                                  </div>
                                </div>
                                <Badge className="ml-2 shrink-0">{i.status}</Badge>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {displayCategory(i.category)}
                                </Badge>
                                {i.disposition && (
                                  <Badge variant="outline" className="text-xs">
                                    {i.disposition}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Build Quality:</span>
                                  <span className="font-medium">{i.build_quality || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Condition:</span>
                                  <span className="font-medium">{i.condition || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Lifespan:</span>
                                  <span className="font-medium">{i.user_lifespan ? `${i.user_lifespan}y` : "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Usage:</span>
                                  <span className="font-medium">{i.usage_pattern || "—"}</span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                  <span className="text-muted-foreground">Current Price:</span>
                                  <div>
                                    <div className="font-medium text-green-600">
                                      {i.current_price ? `₹${i.current_price.toLocaleString()}` : "₹0"}
                                    </div>
                                    {i.predicted_price && i.predicted_price !== (i.current_price || 0) && (
                                      <div className="text-xs text-right text-gray-500">
                                        ML predicted: ₹{i.predicted_price.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="pt-2 border-t border-border/30">
                                <div className="text-xs text-muted-foreground">
                                  Reported: {new Date(i.reported_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle>Schedule pickup</CardTitle>
                <CardDescription>Select items with status "Reported" and assign a vendor.</CardDescription>
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

          <TabsContent value="pickups" className="space-y-4">
            <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle>Pickup Management</CardTitle>
                <CardDescription>Monitor scheduled pickups and vendor responses.</CardDescription>
              </CardHeader>
              <CardContent>
                {adminPickups.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No pickups scheduled.</div>
                ) : (
                  <div className="space-y-4">
                    {adminPickups.map((pickup) => (
                      <div key={pickup.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Pickup #{pickup.id.slice(0, 8)}</div>
                            <div className="text-sm text-muted-foreground">
                              Scheduled: {new Date(pickup.scheduled_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              pickup.status === "Vendor_Accepted" ? "default" : 
                              pickup.status === "Vendor_Rejected" ? "destructive" : 
                              "secondary"
                            }>
                              {pickup.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-2">Vendor Information</div>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Company:</span> {pickup.vendor.company}</div>
                              <div><span className="font-medium">Contact Person:</span> {pickup.vendor.name}</div>
                              <div><span className="font-medium">Email:</span> {pickup.vendor.email}</div>
                              <div><span className="font-medium">CPCB Registration:</span> {pickup.vendor.cpcb_registration_no}</div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-2">Items ({pickup.items.length})</div>
                            <div className="text-sm space-y-1">
                              {pickup.items.slice(0, 3).map((item) => (
                                <div key={item.id}>
                                  {item.name} <span className="text-muted-foreground">({displayCategory(item.category)})</span>
                                </div>
                              ))}
                              {pickup.items.length > 3 && (
                                <div className="text-muted-foreground">
                                  +{pickup.items.length - 3} more items
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Vendor Response Section */}
                        {pickup.vendor_response && (
                          <div className={`rounded-lg p-3 border-l-4 ${
                            pickup.vendor_response === "Accepted" 
                              ? "bg-green-50 border-green-400 border-l-green-400" 
                              : "bg-red-50 border-red-400 border-l-red-400"
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className={`font-medium ${
                                pickup.vendor_response === "Accepted" ? "text-green-700" : "text-red-700"
                              }`}>
                                Vendor Response: {pickup.vendor_response}
                              </div>
                              {pickup.vendor_response_date && (
                                <div className="text-xs text-muted-foreground">
                                  {new Date(pickup.vendor_response_date).toLocaleString()}
                                </div>
                              )}
                            </div>
                            {pickup.vendor_response_note && (
                              <div className="text-sm text-muted-foreground mb-2">
                                <span className="font-medium">Note:</span> {pickup.vendor_response_note}
                              </div>
                            )}
                            {pickup.vendor_response === "Rejected" && (
                              <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 border border-blue-200">
                                💡 Items from this rejected pickup are now available for rescheduling in the Items tab
                              </div>
                            )}
                          </div>
                        )}

                        {!pickup.vendor_response && pickup.status === "Scheduled" && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="text-sm text-yellow-700">
                              ⏳ Awaiting vendor response
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-[#3e5f44]">Key Performance Indicators</CardTitle>
                <CardDescription className="text-[#3e5f44]/70">High-level performance indicators and metrics.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                  <div className="text-xs text-[#3e5f44]/70 font-medium">E-Waste Recovery Rate</div>
                  <div className="text-2xl font-bold text-[#3e5f44]">{recovery ? `${recovery.rate}%` : "—"}</div>
                  <div className="text-xs text-[#3e5f44]/60">Collected: {items.filter(i => i.status === "Collected").length} · Safely Disposed: {items.filter(i => i.status === "Safely Disposed").length}</div>
                </div>
                <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                  <div className="text-xs text-[#3e5f44]/70 font-medium">Total E-Waste Items</div>
                  <div className="text-2xl font-bold text-[#3e5f44]">{items.length}</div>
                  <div className="text-xs text-[#3e5f44]/60">Registered in system</div>
                </div>
                <div 
                  className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent cursor-pointer hover:from-[#9ac37e]/10 hover:shadow-md transition-all duration-200"
                  onClick={() => router.push('/vendors')}
                >
                  <div className="text-xs text-[#3e5f44]/70 font-medium">Active Vendors</div>
                  <div className="text-2xl font-bold text-[#3e5f44]">{vendors.length}</div>
                  <div className="text-xs text-[#3e5f44]/60">CPCB authorized partners</div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Category Distribution Chart */}
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44]">E-Waste Categories</CardTitle>
                  <CardDescription>Distribution by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Items",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <PieChart>
                      <Pie
                        data={catDist}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, count }) => `${category}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {catDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Status Distribution Chart */}
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44]">Item Status Distribution</CardTitle>
                  <CardDescription>Current processing status of items</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Items",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <BarChart data={statusDist}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="status" 
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#3e5f44" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Disposition Distribution Chart */}
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44]">Item Dispositions</CardTitle>
                  <CardDescription>Environmental handling classification</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Items",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <PieChart>
                      <Pie
                        data={dispositionDist}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ disposition, percentage }) => `${disposition}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {dispositionDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Items Reported by Date */}
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44]">Daily Reporting Trends</CardTitle>
                  <CardDescription>Items reported over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Items Reported",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <BarChart data={itemsByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="formattedDate" 
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#6b8f71" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Volume Chart */}
            <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-[#3e5f44]">Monthly Volume Trends</CardTitle>
                <CardDescription>E-waste collection trends by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Items",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={volumeTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#9ac37e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
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
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()

  // Get current date and calculate year range dynamically
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) // Today at 00:00:00
  const maxDate = new Date(currentYear + 2, 11, 31) // End of year + 2 years

  // Custom setter for "from" date that clears "to" date if it becomes invalid
  const handleFromDateChange = (newFromDate: Date | undefined) => {
    setFrom(newFromDate)
    // If "to" date is before the new "from" date, clear it
    if (newFromDate && to && to < newFromDate) {
      setTo(undefined)
    }
  }

  async function downloadPdf() {
    const qs = new URLSearchParams()
    if (from) qs.set("from", format(from, "yyyy-MM-dd"))
    if (to) qs.set("to", format(to, "yyyy-MM-dd"))
    const res = await fetch(`/api/reports/summary?${qs.toString()}`)
    const summary = await res.json()

    const { jsPDF } = await import("jspdf")
    // @ts-ignore
    const { default: autoTable } = await import("jspdf-autotable")
    
    const doc = new jsPDF()
    let yPosition = 20

    // Helper function to add page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > 280) {
        doc.addPage()
        yPosition = 20
      }
    }

    // Header with logo and title
    doc.setFillColor(62, 95, 68) // Dark green
    doc.rect(0, 0, 210, 30, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("SMART E-WASTE MANAGEMENT SYSTEM", 105, 15, { align: "center" })
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text("CPCB Compliance Report", 105, 23, { align: "center" })
    
    yPosition = 40
    doc.setTextColor(0, 0, 0)

    // Report Information
    doc.setFillColor(154, 195, 126) // Light green
    doc.rect(14, yPosition, 182, 25, 'F')
    
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Report Information", 20, yPosition + 8)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, yPosition + 16)
    doc.text(`Period: ${summary.from || "Beginning"} to ${summary.to || "Present"}`, 20, yPosition + 21)
    doc.text(`Total Items Processed: ${summary.total}`, 120, yPosition + 16)
    doc.text(`Recovery Rate: ${summary.environmentalImpact.recoveryRate}%`, 120, yPosition + 21)
    
    yPosition += 35

    // Executive Summary
    checkPageBreak(40)
    doc.setFillColor(240, 248, 243)
    doc.rect(14, yPosition, 182, 35, 'F')
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Executive Summary", 20, yPosition + 8)
    
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    const summaryText = `This report presents a comprehensive analysis of e-waste management activities for the specified period, demonstrating compliance with Central Pollution Control Board (CPCB) regulations and E-Waste Management Rules 2016. The organization has processed ${summary.total} electronic items with a recovery rate of ${summary.environmentalImpact.recoveryRate}%, contributing to environmental sustainability through proper recycling and disposal practices.`
    
    const splitSummary = doc.splitTextToSize(summaryText, 170)
    doc.text(splitSummary, 20, yPosition + 16)
    
    yPosition += 45

    // Item Status Analysis
    checkPageBreak(60)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Item Status Analysis", 14, yPosition)
    yPosition += 10
    
    const statusData = Object.entries(summary.byStatus)
      .filter(([_, count]) => (count as number) > 0)
      .map(([status, count]) => [
        status,
        (count as number).toString(),
        `${(((count as number) / summary.total) * 100).toFixed(1)}%`,
        getStatusCompliance(status)
      ])

    // @ts-ignore
    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Count', 'Percentage', 'CPCB Compliance']],
      body: statusData,
      theme: 'grid',
      headStyles: { 
        fillColor: [62, 95, 68],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 251, 247] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 87 }
      }
    })
    
    // @ts-ignore
    yPosition = doc.lastAutoTable.finalY + 15

    // Category Distribution
    checkPageBreak(60)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Category Distribution", 14, yPosition)
    yPosition += 10

    const categoryData = Object.entries(summary.byCategory)
      .filter(([_, count]) => (count as number) > 0)
      .map(([category, count]) => [
        category,
        (count as number).toString(),
        `${(((count as number) / summary.total) * 100).toFixed(1)}%`,
        getCategoryHazardLevel(category)
      ])

    // @ts-ignore
    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Count', 'Percentage', 'Hazard Level']],
      body: categoryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [62, 95, 68],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 251, 247] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 87 }
      }
    })
    
    // @ts-ignore
    yPosition = doc.lastAutoTable.finalY + 15

    // Department-wise Analysis
    checkPageBreak(60)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Department-wise Analysis", 14, yPosition)
    yPosition += 10

    const departmentData = Object.entries(summary.byDepartment)
      .filter(([_, count]) => (count as number) > 0)
      .map(([department, count]) => [
        department,
        (count as number).toString(),
        `${(((count as number) / summary.total) * 100).toFixed(1)}%`
      ])

    // @ts-ignore
    autoTable(doc, {
      startY: yPosition,
      head: [['Department', 'Items Reported', 'Percentage']],
      body: departmentData,
      theme: 'grid',
      headStyles: { 
        fillColor: [62, 95, 68],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 251, 247] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' }
      }
    })
    
    // @ts-ignore
    yPosition = doc.lastAutoTable.finalY + 15

    // Detailed Items List
    checkPageBreak(80)
    doc.setFillColor(154, 195, 126)
    doc.rect(14, yPosition, 182, 8, 'F')
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Detailed Items List", 20, yPosition + 6)
    yPosition += 15

    // Prepare items data for the table
    const itemsData = summary.items.map((item: any) => [
      item.id.substring(0, 8) + '...', // Truncate ID for better fit
      item.name,
      item.category,
      item.disposition || 'Not Specified',
      item.status,
      new Date(item.reported_date).toLocaleDateString(),
      item.reported_by || 'Unknown'
    ])

    // Split items into chunks if there are too many
    const itemsPerPage = 25
    const totalItems = itemsData.length
    
    if (totalItems > 0) {
      for (let i = 0; i < totalItems; i += itemsPerPage) {
        const chunk = itemsData.slice(i, i + itemsPerPage)
        
        if (i > 0) {
          checkPageBreak(100) // Ensure space for new table
        }
        
        // @ts-ignore
        autoTable(doc, {
          startY: yPosition,
          head: [['Item ID', 'Name', 'Category', 'Disposition', 'Status', 'Reported Date', 'Reported By']],
          body: chunk,
          theme: 'grid',
          headStyles: { 
            fillColor: [62, 95, 68],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold'
          },
          bodyStyles: { fontSize: 7 },
          alternateRowStyles: { fillColor: [245, 251, 247] },
          columnStyles: {
            0: { cellWidth: 22 }, // Item ID
            1: { cellWidth: 35 }, // Name
            2: { cellWidth: 20 }, // Category
            3: { cellWidth: 25 }, // Disposition
            4: { cellWidth: 25 }, // Status
            5: { cellWidth: 25 }, // Reported Date
            6: { cellWidth: 30 }  // Reported By
          }
        })
        
        // @ts-ignore
        yPosition = doc.lastAutoTable.finalY + 10
        
        // Add page break if there are more items
        if (i + itemsPerPage < totalItems) {
          doc.addPage()
          yPosition = 20
        }
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(128, 128, 128)
      doc.text("No items found in the selected date range.", 20, yPosition)
      yPosition += 20
    }
    
    yPosition += 10

    // CPCB Compliance Statement
    checkPageBreak(50)
    doc.setFillColor(255, 245, 230)
    doc.rect(14, yPosition, 182, 40, 'F')
    
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(184, 134, 11)
    doc.text("CPCB Compliance Statement", 20, yPosition + 8)
    
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    const complianceText = `This report confirms compliance with the E-Waste (Management) Rules, 2016, as amended by CPCB. All e-waste items have been handled in accordance with Schedule I of the E-Waste Rules. Proper segregation, collection, and disposal methods have been followed. Hazardous materials have been identified and managed according to prescribed guidelines. The organization maintains proper documentation and tracking systems as required by regulatory authorities.`
    
    const splitCompliance = doc.splitTextToSize(complianceText, 170)
    doc.text(splitCompliance, 20, yPosition + 16)
    
    yPosition += 50

    // Footer
    doc.setFillColor(62, 95, 68)
    doc.rect(0, 287, 210, 10, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Generated by SMART E-WASTE MANAGEMENT SYSTEM", 14, 293)
    doc.text(`Page 1 of ${doc.getNumberOfPages()}`, 180, 293)

    // Add page numbers to all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFillColor(62, 95, 68)
      doc.rect(0, 287, 210, 10, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.text("Generated by SMART E-WASTE MANAGEMENT SYSTEM", 14, 293)
      doc.text(`Page ${i} of ${totalPages}`, 180, 293)
    }

    doc.save(`CPCB_EWaste_Report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  function getStatusCompliance(status: string): string {
    const complianceMap: Record<string, string> = {
      'Reported': 'Initial Registration - Compliant',
      'Awaiting Pickup': 'Temporary Storage - Compliant',
      'Scheduled': 'Collection Arranged - Compliant', 
      'Collected': 'In Transit to Facility - Compliant',
      'Recycled': 'Material Recovery - Fully Compliant',
      'Refurbished': 'Life Extension - Fully Compliant',
      'Safely Disposed': 'Environmentally Sound - Fully Compliant'
    }
    return complianceMap[status] || 'Under Review'
  }

  function getCategoryHazardLevel(category: string): string {
    const hazardMap: Record<string, string> = {
      'Tablet': 'Medium - Contains Li-ion battery',
      'Microwave': 'High - Contains magnetron and capacitors',
      'Air Conditioner': 'High - Refrigerants and electrical components',
      'TV': 'High - Contains heavy metals and mercury',
      'Washing Machine': 'Medium - Electrical components and motors',
      'Laptop': 'Medium - Contains Li-ion battery',
      'Smartphone': 'Medium - Contains Li-ion battery and rare earth metals',
      'Refrigerator': 'High - Refrigerants and foam blowing agents'
    }
    return hazardMap[category] || 'Assessment Required'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#3e5f44]">Compliance Reports</CardTitle>
        <CardDescription>
          Generate comprehensive CPCB-aligned e-waste management reports with detailed analytics, 
          environmental impact assessment, and regulatory compliance documentation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-[180px_180px_auto] gap-3">
          <div className="grid gap-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {from ? format(from, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={from}
                  onSelect={handleFromDateChange}
                  disabled={(date) => date > today}
                  showOutsideDays={false}
                  captionLayout="dropdown"
                  fromDate={new Date(2020, 0, 1)}
                  toDate={today}
                  fromYear={2020}
                  toYear={currentYear}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {to ? format(to, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={to}
                  onSelect={setTo}
                  disabled={(date) => {
                    if (from) {
                      // Disable dates before the selected "from" date and after today
                      return date < from || date > today
                    }
                    // If no "from" date selected, disable future dates only
                    return date > today
                  }}
                  showOutsideDays={false}
                  captionLayout="dropdown"
                  fromDate={from || new Date(2020, 0, 1)}
                  toDate={today}
                  fromYear={from ? from.getFullYear() : 2020}
                  toYear={currentYear}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={downloadPdf} 
              className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white"
            >
              Generate PDF Report
            </Button>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-[#9ac37e]/10 to-transparent border border-[#9ac37e]/30 rounded-lg p-4">
          <h4 className="font-semibold text-[#3e5f44] mb-2">Report Features:</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-[#3e5f44]/80">
            <div>• Executive summary and compliance statement</div>
            <div>• Detailed items list with full tracking data</div>
            <div>• Item status analysis with percentages</div>
            <div>• Department-wise breakdown</div>
            <div>• Category distribution with hazard levels</div>
            <div>• CPCB regulatory compliance verification</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
  }


function CampaignsSection() {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<Date>()
  const [description, setDescription] = useState("")
  const [rows, setRows] = useState<Array<{ id: string; title: string; date: string; description?: string }>>([])

  // Get current date and calculate year range dynamically
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) // Today at 00:00:00
  const maxDate = new Date(currentYear + 2, 11, 31) // End of year + 2 years

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
      body: JSON.stringify({ title, date: format(date, "yyyy-MM-dd"), description }),
    })
    if (res.ok) {
      setTitle("")
      setDate(undefined)
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < today}
                  showOutsideDays={false}
                  captionLayout="dropdown"
                  fromDate={today}
                  toDate={maxDate}
                  fromYear={currentYear}
                  toYear={currentYear + 2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
