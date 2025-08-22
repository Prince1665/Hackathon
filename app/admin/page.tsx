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
import { CalendarIcon, Trash2, Gavel } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

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
  price_source?: string
  predicted_price?: number
}

type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }

// Helper function for sustainability calculations
function getItemWeight(category: string): number {
  const weights: Record<string, number> = {
    "Laptop": 2.5,
    "Smartphone": 0.2,
    "Tablet": 0.5,
    "TV": 25,
    "Refrigerator": 70,
    "Washing Machine": 80,
    "Air Conditioner": 50,
    "Microwave": 15
  }
  return weights[category] || 2
}

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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [deletingItems, setDeletingItems] = useState(false)

  // Chart colors
  const CHART_COLORS = ['#3e5f44', '#9ac37e', '#6b8f71', '#a8d18a', '#4a6e50', '#7ca67f', '#8fb585']

  async function load() {
    try {
      const qs = new URLSearchParams()
      if (status) qs.set("status", status)
      if (category) qs.set("category", category)
      if (disp) qs.set("disposition", disp as any)
      
      // Use parallel requests for better performance
      const [itemsResponse, pickupsResponse] = await Promise.all([
        fetch(`/api/items?${qs.toString()}`),
        fetch("/api/admin/pickups")
      ])
      
      if (!itemsResponse.ok) {
        console.error('Failed to fetch items:', itemsResponse.status)
        return
      }
      
      const [itemsData, pickupsData] = await Promise.all([
        itemsResponse.json(),
        pickupsResponse.ok ? pickupsResponse.json() : []
      ])
      
      // Handle items data
      if (Array.isArray(itemsData)) {
        setItems(itemsData)
      } else if (itemsData.items && Array.isArray(itemsData.items)) {
        setItems(itemsData.items)
      } else {
        console.error('Unexpected items API response format:', itemsData)
        setItems([])
      }
      
      // Handle pickups data
      if (Array.isArray(pickupsData)) {
        setAdminPickups(pickupsData)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      setItems([])
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        
        // Phase 1: Load critical data immediately (show UI faster)
        setIsLoading(true)
        setIsLoadingAnalytics(true)
        
        const criticalDataPromises = [
          fetch(`/api/items?${new URLSearchParams(status ? {status} : {}).toString()}`).then(async r => {
            if (!r.ok) throw new Error('Failed to fetch items')
            const data = await r.json()
            const items = Array.isArray(data) ? data : (data.items || [])
            setItems(items)
            return items
          }),
          fetch("/api/vendors").then(async r => {
            if (!r.ok) return []
            const vendors = await r.json()
            setVendors(Array.isArray(vendors) ? vendors : [])
            return vendors
          })
        ]
        
        // Wait for critical data and immediately show the interface
        await Promise.allSettled(criticalDataPromises)
        setIsLoading(false) // Show interface with critical data
        
        // Phase 2: Load secondary data in background (analytics, pickups)
        const secondaryPromises = [
          fetch("/api/admin/pickups").then(async r => {
            if (!r.ok) return []
            const pickups = await r.json()
            setAdminPickups(Array.isArray(pickups) ? pickups : [])
            return pickups
          }),
          // Load analytics data in parallel chunks for better performance
          Promise.all([
            fetch("/api/analytics/volume-trends").then(r => r.ok ? r.json() : []).then(setVolumeTrends),
            fetch("/api/analytics/category-distribution").then(r => r.ok ? r.json() : []).then(setCatDist),
            fetch("/api/analytics/recovery-rate").then(r => r.ok ? r.json() : []).then(setRecovery)
          ]),
          Promise.all([
            fetch("/api/analytics/status-distribution").then(r => r.ok ? r.json() : []).then(setStatusDist),
            fetch("/api/analytics/disposition-distribution").then(r => r.ok ? r.json() : []).then(setDispositionDist),
            fetch("/api/analytics/items-by-date").then(r => r.ok ? r.json() : []).then(setItemsByDate)
          ])
        ]
        
        // Load secondary data without blocking UI
        await Promise.allSettled(secondaryPromises)
        setIsLoadingAnalytics(false)
        
      } catch (error) {
        console.error('Error loading admin dashboard:', error)
        setError('Failed to load some dashboard data')
        setIsLoading(false)
        setIsLoadingAnalytics(false)
      }
    }
    
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category, disp])

  const handleDeleteItems = async (itemIds: string[]) => {
    if (itemIds.length === 0) return

    setDeletingItems(true)
    try {
      const response = await fetch('/api/items/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete items')
      }

      // Clear selection and reload data
      setSelected({})
      setDeleteMode(false)
      await load()

    } catch (error) {
      console.error('Error deleting items:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete items')
    } finally {
      setDeletingItems(false)
    }
  }

  const filtered = useMemo(() => {
    let result = items
    
    // Apply status filter
    if (status) {
      result = result.filter(i => i.status === status)
    }
    
    // Apply category filter  
    if (category) {
      result = result.filter(i => i.category === category)
    }
    
    // Apply disposition filter
    if (disp) {
      result = result.filter(i => i.disposition === disp)
    }
    
    // Apply search filter last (most expensive)
    if (q) {
      const qq = q.toLowerCase()
      result = result.filter((i) => {
        const searchText = `${i.name} ${i.description || ''} ${i.id} ${i.reported_by}`.toLowerCase()
        return searchText.includes(qq)
      })
    }
    
    return result
  }, [items, q, status, category, disp])

  const selectable = useMemo(() => 
    deleteMode 
      ? filtered.filter((i) => i.status === "Collected" || i.status === "Safely Disposed")
      : filtered.filter((i) => i.status === "Reported"), 
    [filtered, deleteMode]
  )

  // Memoized environmental calculations
  const environmentalMetrics = useMemo(() => {
    const totalCO2 = Math.round(items.reduce((sum, item) => sum + (getItemWeight(item.category) * 2.1), 0))
    const totalWeight = Math.round(items.reduce((sum, item) => sum + getItemWeight(item.category), 0))
    const treesEquivalent = Math.round(totalCO2 / 22)
    const energySaved = Math.round(totalWeight * 12)
    const waterSaved = Math.round(totalWeight * 50)
    
    return { totalCO2, totalWeight, treesEquivalent, energySaved, waterSaved }
  }, [items])

  const communityMetrics = useMemo(() => {
    const activeParticipants = new Set(items.map(item => item.reported_by).filter(Boolean)).size
    const greenWarriors = Math.floor(activeParticipants * 0.3)
    const activeStreaks = Math.floor(activeParticipants * 0.15) 
    const hazardHeroes = Math.min(
      items.filter(item => item.disposition === "Hazardous").length,
      Math.floor(activeParticipants * 0.2)
    )
    
    return { activeParticipants, greenWarriors, activeStreaks, hazardHeroes }
  }, [items])

  const classificationMetrics = useMemo(() => {
    const reusableCount = items.filter(item => item.disposition === "Reusable").length
    const recyclableCount = items.filter(item => item.disposition === "Recyclable").length
    const hazardousCount = items.filter(item => item.disposition === "Hazardous").length
    const sustainabilityScore = Math.round(
      (reusableCount * 40 + recyclableCount * 25 + hazardousCount * 15) / (items.length || 1)
    )
    
    return { reusableCount, recyclableCount, hazardousCount, sustainabilityScore }
  }, [items])

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected])

  // Loading and error states
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
        <AppNav />
        <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 max-w-7xl">
          {/* Fast skeleton loading */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          
          {/* Quick stats skeleton */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          
          {/* Table skeleton */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="p-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
        <AppNav />
        <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600 mb-2">Error Loading Dashboard</div>
              <div className="text-sm text-muted-foreground mb-4">{error}</div>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
      <AppNav />
      <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 max-w-7xl">
        <Tabs defaultValue="items">
          <TabsList className="grid w-full grid-cols-2 grid-rows-3 md:grid-cols-6 md:grid-rows-1 gap-2 sm:gap-3 p-2 sm:p-3 bg-[#9ac37e]/10 rounded-none border-2 border-[#3e5f44] h-auto">
            <TabsTrigger value="items" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Items</TabsTrigger>
            <TabsTrigger value="pickups" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Pickups</TabsTrigger>
            <TabsTrigger value="auctions" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20 h-10 sm:h-12 flex items-center justify-center text-xs sm:text-sm">Auctions</TabsTrigger>
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
                
                {/* Price Source Legend */}
                <div className="bg-muted/30 border border-muted rounded-lg p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Price Sources:</div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-blue-500">🤖</span>
                      <span>ML Predicted</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-purple-500">👤</span>
                      <span>User Provided</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden bg-background">
                  {/* Desktop table view - Single scroll container */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <div className="min-w-[1400px]">
                        <div className="grid grid-cols-[24px_180px_220px_140px_120px_100px_90px_90px_110px_90px_100px_110px_110px] gap-3 px-4 py-3 text-xs text-muted-foreground bg-muted/50 sticky top-0 z-10 font-medium">
                          <div />
                          <div>ID</div>
                          <div>Name</div>
                          <div>Category</div>
                          <div>Disposition</div>
                          <div>Status</div>
                          <div>Reported</div>
                          <div className="text-center">Build Quality</div>
                          <div className="text-center">Expected Lifespan</div>
                          <div className="text-center">Usage Pattern</div>
                          <div className="text-center">Condition</div>
                          <div className="text-right">Cost Price</div>
                          <div className="text-right">Price (Source)</div>
                        </div>
                        <Separator />
                        <div className="divide-y border-t">
                          {filtered.map((i) => (
                            <div key={i.id} className="grid grid-cols-[24px_180px_220px_140px_120px_100px_90px_90px_110px_90px_100px_110px_110px] gap-3 items-center px-4 py-4 text-sm hover:bg-muted/30 transition-colors border-b border-border/50">
                              {(i.status === "Reported" && !deleteMode) || (deleteMode && (i.status === "Collected" || i.status === "Safely Disposed")) ? (
                                <Checkbox checked={!!selected[i.id]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: !!v }))} aria-label="Select row" />
                              ) : (
                                <div className="w-6" />
                              )}
                              <div className="text-xs text-muted-foreground truncate pr-2">{i.id}</div>
                              <div className="truncate font-medium pr-2" title={i.name}>{i.name}</div>
                              <div className="flex justify-start"><Badge variant="secondary" className="whitespace-nowrap text-xs px-2 py-1 max-w-full truncate">{displayCategory(i.category)}</Badge></div>
                              <div className="flex justify-start">{i.disposition ? <Badge variant="outline" className="whitespace-nowrap text-xs px-2 py-1 max-w-full truncate">{i.disposition}</Badge> : <span className="text-muted-foreground">—</span>}</div>
                              <div className="flex justify-start"><Badge className="whitespace-nowrap text-xs px-2 py-1 max-w-full truncate">{i.status}</Badge></div>
                              <div className="text-xs whitespace-nowrap text-muted-foreground">{new Date(i.reported_date).toLocaleDateString()}</div>
                              <div className="text-center text-sm px-1">{i.build_quality || "—"}</div>
                              <div className="text-center text-sm px-1">{i.user_lifespan ? `${i.user_lifespan}y` : "—"}</div>
                              <div className="text-center text-sm px-1" title={i.usage_pattern}>{i.usage_pattern || "—"}</div>
                              <div className="text-center text-sm px-1">{i.condition || "—"}</div>
                              <div className="text-right text-sm px-1">{i.original_price ? `₹${i.original_price}` : "—"}</div>
                              <div className="text-right text-sm font-semibold px-1 text-green-600">
                                {i.price_source === "ml_predicted" && i.predicted_price ? (
                                  <div className="flex flex-col items-end">
                                    <span>₹{i.predicted_price}</span>
                                    <span className="text-xs text-blue-500 font-normal">🤖 ML</span>
                                  </div>
                                ) : i.price_source === "user_provided" && i.current_price ? (
                                  <div className="flex flex-col items-end">
                                    <span>₹{i.current_price}</span>
                                    <span className="text-xs text-purple-500 font-normal">👤 User</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span>₹{i.current_price || 0}</span>
                                    <span className="text-xs text-blue-500 font-normal">🤖 ML</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Mobile card view */}
                  <div className="lg:hidden max-h-[500px] overflow-y-auto divide-y">
                    {filtered.map((i) => (
                      <div key={i.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {(i.status === "Reported" && !deleteMode) || (deleteMode && (i.status === "Collected" || i.status === "Safely Disposed")) ? (
                              <Checkbox checked={!!selected[i.id]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: !!v }))} aria-label="Select row" />
                            ) : (
                              <div className="w-6" />
                            )}
                            <div>
                              <div className="font-medium">{i.name}</div>
                              <div className="text-xs text-muted-foreground">{i.id}</div>
                            </div>
                          </div>
                          <Badge>{i.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{displayCategory(i.category)}</Badge>
                          {i.disposition && <Badge variant="outline">{i.disposition}</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Build Quality: {i.build_quality || "—"}</div>
                          <div>Condition: {i.condition || "—"}</div>
                          <div>Expected Lifespan: {i.user_lifespan ? `${i.user_lifespan}y` : "—"}</div>
                          <div>Usage: {i.usage_pattern || "—"}</div>
                          <div>Cost Price: {i.original_price ? `₹${i.original_price}` : "—"}</div>
                          <div className="flex items-center gap-1">
                            Price: {i.price_source === "ml_predicted" && i.predicted_price ? (
                              <>₹{i.predicted_price} <span className="text-blue-500 text-xs">🤖</span></>
                            ) : i.price_source === "user_provided" && i.current_price ? (
                              <>₹{i.current_price} <span className="text-purple-500 text-xs">👤</span></>
                            ) : (
                              <>₹{i.current_price || 0} <span className="text-blue-500 text-xs">🤖</span></>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Reported: {new Date(i.reported_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle>Schedule pickup</CardTitle>
                <CardDescription>
                  {deleteMode 
                    ? "Switch to normal mode to schedule pickups for reported items."
                    : "Select items with status 'Reported' and assign a vendor."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Selected items: {selectedIds.length} / Eligible: {selectable.length}
                </div>
                {!deleteMode && (
                  <SchedulePickupDialog
                    items={selectable}
                    selectedIds={selectedIds}
                    vendors={vendors}
                    onScheduled={async () => {
                      setSelected({})
                      await load()
                    }}
                  />
                )}
                {deleteMode && (
                  <div className="text-sm text-muted-foreground italic">
                    Pickup scheduling is disabled in delete mode.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-200 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete Processed Items
                </CardTitle>
                <CardDescription>
                  {deleteMode 
                    ? "Select items with status 'Collected' or 'Safely Disposed' to permanently remove from database."
                    : "Enable delete mode to remove completed items that are no longer needed."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {deleteMode 
                    ? `Selected items: ${selectedIds.length} / Eligible: ${selectable.length}`
                    : "Toggle delete mode to manage processed items"}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={deleteMode ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => {
                      setDeleteMode(!deleteMode)
                      setSelected({})
                    }}
                    disabled={deletingItems}
                  >
                    {deleteMode ? "Cancel Delete Mode" : "Enable Delete Mode"}
                  </Button>
                  {deleteMode && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={selectedIds.length === 0 || deletingItems}
                        >
                          {deletingItems ? "Deleting..." : `Delete ${selectedIds.length} Items`}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Permanent Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete {selectedIds.length} processed items from the database? 
                            This action cannot be undone and will remove all associated data including pickup records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteItems(selectedIds)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
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

            {/* Enhanced Sustainability Analytics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44] flex items-center gap-2">
                    🌍 Environmental Impact
                  </CardTitle>
                  <CardDescription>Real-time sustainability metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-green-600">
                    {environmentalMetrics.totalCO2} kg
                  </div>
                  <div className="text-sm text-muted-foreground">CO₂ Emissions Prevented</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>🌳 {environmentalMetrics.treesEquivalent} Trees</div>
                    <div>⚡ {environmentalMetrics.energySaved} kWh</div>
                    <div>💧 {environmentalMetrics.waterSaved}L Water</div>
                    <div>♻️ {environmentalMetrics.totalWeight}kg Diverted</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44] flex items-center gap-2">
                    🏆 Community Engagement
                  </CardTitle>
                  <CardDescription>User participation & challenges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {communityMetrics.activeParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Participants</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>🌱 Green Warriors</span>
                      <span className="font-semibold">{communityMetrics.greenWarriors}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>♻️ Active Streaks</span>
                      <span className="font-semibold">{communityMetrics.activeStreaks}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>⚠️ Hazard Heroes</span>
                      <span className="font-semibold">{communityMetrics.hazardHeroes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44] flex items-center gap-2">
                    🤖 Smart Classification
                  </CardTitle>
                  <CardDescription>AI-powered waste categorization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600">{classificationMetrics.reusableCount}</div>
                      <div className="text-xs text-green-700">Reusable</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-600">{classificationMetrics.recyclableCount}</div>
                      <div className="text-xs text-blue-700">Recyclable</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-orange-600">{classificationMetrics.hazardousCount}</div>
                      <div className="text-xs text-orange-700">Hazardous</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sustainability Score: {classificationMetrics.sustainabilityScore}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Category Distribution Chart */}
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44]">E-Waste Categories</CardTitle>
                  <CardDescription>Distribution by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  {catDist && catDist.length > 0 ? (
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <div className="text-sm">No category data available</div>
                        <div className="text-xs">Chart will appear when items are added</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution Chart */}
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44]">Item Status Distribution</CardTitle>
                  <CardDescription>Current processing status of items</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusDist && statusDist.length > 0 ? (
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <div className="text-sm">No status data available</div>
                        <div className="text-xs">Chart will appear when items are processed</div>
                      </div>
                    </div>
                  )}
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
                  {dispositionDist && dispositionDist.length > 0 ? (
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <div className="text-sm">No disposition data available</div>
                        <div className="text-xs">Chart will appear when items are classified</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items Reported by Date */}
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-[#3e5f44]">Daily Reporting Trends</CardTitle>
                  <CardDescription>Items reported over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {itemsByDate && itemsByDate.length > 0 ? (
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <div className="text-sm">No daily trends data available</div>
                        <div className="text-xs">Chart will appear with reporting activity</div>
                      </div>
                    </div>
                  )}
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
                {volumeTrends && volumeTrends.length > 0 ? (
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
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="text-sm">No volume trends data available</div>
                      <div className="text-xs">Chart will appear with historical data</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auctions" className="space-y-4">
            <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-[#3e5f44]" />
                  Auction Management
                </CardTitle>
                <CardDescription>Monitor and manage all auction activity across the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-emerald-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Active Auctions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-600">
                        Loading...
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Total Auction Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        Loading...
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Recent Bids</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        Loading...
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.open('/admin/auctions', '_blank')}
                    className="bg-[#3e5f44] hover:bg-[#2d5016]"
                  >
                    View All Auctions
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        await fetch('/api/auctions/process-expired', { method: 'POST' })
                        // Refresh page or show success message
                      } catch (error) {
                        console.error('Error processing expired auctions:', error)
                      }
                    }}
                  >
                    Process Expired Auctions
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>• View and monitor all auction activity in real-time</p>
                  <p>• Process expired auctions and notify winners</p>
                  <p>• Track bidding patterns and auction performance</p>
                </div>
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

    // Helper function to add page if needed with better margin management
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > 260) { // Further reduced to account for footer at 287
        doc.addPage()
        yPosition = 25 // Start lower on new pages for better spacing
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
    const summaryText = `This report presents a comprehensive analysis of e-waste management activities for the specified period, demonstrating compliance with Central Pollution Control Board (CPCB) regulations and E-Waste Management Rules 2016. The organization has processed ${summary.total} electronic items with a recovery rate of ${summary.environmentalImpact.recoveryRate}%, contributing to environmental sustainability through proper recycling and disposal practices.

SUSTAINABILITY IMPACT: This period's e-waste management prevented ${summary.environmentalImpact.totalCO2Impact}kg CO2 emissions (equivalent to ${summary.environmentalImpact.treesEquivalent} trees), saved ${summary.environmentalImpact.energySavedKWh} kWh energy, conserved ${summary.environmentalImpact.waterSavedLiters}L water, and diverted ${summary.environmentalImpact.totalWeight}kg from landfills. Materials recovered: ${summary.environmentalImpact.metalsRecovered}kg metals, ${summary.environmentalImpact.plasticsRecovered}kg plastics, ${summary.environmentalImpact.rareearthRecovered}kg rare earth elements.`
    
    const splitSummary = doc.splitTextToSize(summaryText, 170)
    doc.text(splitSummary, 20, yPosition + 16)
    
    yPosition += Math.max(45, splitSummary.length * 3 + 25) // Dynamic spacing based on summary length

    // Item Status Analysis
    checkPageBreak(70) // Increased space requirement for table
    
    // Add section separator line
    doc.setDrawColor(154, 195, 126)
    doc.setLineWidth(0.5)
    doc.line(14, yPosition - 5, 196, yPosition - 5)
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Item Status Analysis", 14, yPosition)
    yPosition += 15 // Increased spacing before table
    
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
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [245, 251, 247] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 87 }
      }
    })
    
    // @ts-ignore - Get final Y position and add proper spacing
    yPosition = doc.lastAutoTable.finalY + 20 // Increased spacing after table

    // Category Distribution
    checkPageBreak(70) // Increased space requirement
    
    // Add section separator line
    doc.setDrawColor(154, 195, 126)
    doc.setLineWidth(0.5)
    doc.line(14, yPosition - 5, 196, yPosition - 5)
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Category Distribution", 14, yPosition)
    yPosition += 15 // Consistent spacing

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
    
    // @ts-ignore - Get final Y position and add proper spacing  
    yPosition = doc.lastAutoTable.finalY + 20 // Increased spacing after table

    // Department-wise Analysis
    checkPageBreak(70) // Increased space requirement
    
    // Add section separator line
    doc.setDrawColor(154, 195, 126)
    doc.setLineWidth(0.5)
    doc.line(14, yPosition - 5, 196, yPosition - 5)
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Department-wise Analysis", 14, yPosition)
    yPosition += 15 // Consistent spacing

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
    
    // @ts-ignore - Get final Y position and add proper spacing
    yPosition = doc.lastAutoTable.finalY + 20 // Increased spacing after table

    // Detailed Items List
    checkPageBreak(90) // Increased space requirement for header
    
    // Add section separator line
    doc.setDrawColor(154, 195, 126)
    doc.setLineWidth(0.5)
    doc.line(14, yPosition - 5, 196, yPosition - 5)
    
    doc.setFillColor(154, 195, 126)
    doc.rect(14, yPosition, 182, 8, 'F')
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(62, 95, 68)
    doc.text("Detailed Items List", 20, yPosition + 6)
    yPosition += 18 // Increased spacing after header

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
    const itemsPerPage = 20 // Reduced from 25 to prevent overcrowding
    const totalItems = itemsData.length
    
    if (totalItems > 0) {
      for (let i = 0; i < totalItems; i += itemsPerPage) {
        const chunk = itemsData.slice(i, i + itemsPerPage)
        
        if (i > 0) {
          checkPageBreak(120) // Ensure space for new table with header
          // Add section header on new pages
          doc.setFillColor(154, 195, 126)
          doc.rect(14, yPosition, 182, 8, 'F')
          doc.setFontSize(14)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(62, 95, 68)
          doc.text(`Detailed Items List (continued)`, 20, yPosition + 6)
          yPosition += 18
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
        
        // @ts-ignore - Get final Y position and add proper spacing
        yPosition = doc.lastAutoTable.finalY + 15
        
        // Add page break if there are more items and current page is getting full
        if (i + itemsPerPage < totalItems) {
          checkPageBreak(100) // Check if we need a new page
          if (yPosition < 50) { // If we're on a new page after checkPageBreak
            yPosition = 25 // Reset position for new page
          }
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
              <PopoverContent 
                className="w-auto p-0" 
                align="start"
                side="bottom"
                sideOffset={8}
                avoidCollisions={false}
                sticky="always"
              >
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
              <PopoverContent 
                className="w-auto p-0" 
                align="start"
                side="bottom"
                sideOffset={8}
                avoidCollisions={false}
                sticky="always"
              >
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
              <PopoverContent 
                className="w-auto p-0" 
                align="start"
                side="bottom"
                sideOffset={8}
                avoidCollisions={false}
                sticky="always"
              >
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
