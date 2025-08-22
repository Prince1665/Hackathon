"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, ChevronsUpDown, Gavel } from "lucide-react"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Memoize brands array to prevent re-renders
  const brands = useMemo(() => [
    'HP', 'OnePlus', 'Lenovo', 'Sony', 'Samsung', 'Blue Star',
    'Daikin', 'LG', 'Morphy Richards', 'Voltas', 'Apple', 'IFB',
    'Vivo', 'Bosch', 'TCL', 'Acer', 'Huawei', 'Whirlpool', 'Panasonic',
    'Dell', 'Asus', 'Realme', 'Carrier', 'Xiaomi', 'Godrej'
  ], [])
  
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
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [usePredictedPrice, setUsePredictedPrice] = useState(true)
  const [customPrice, setCustomPrice] = useState<string>("")
  const [priceConfirmed, setPriceConfirmed] = useState(false)
  const [confirmedPriceDetails, setConfirmedPriceDetails] = useState<{
    price: number;
    source: "ml_predicted" | "user_provided";
    predictedPrice?: number;
  } | null>(null)
  
  // Auction-related state
  const [showAuctionDialog, setShowAuctionDialog] = useState(false)
  const [auctionDuration, setAuctionDuration] = useState("24")
  const [creatingAuction, setCreatingAuction] = useState(false)
  const [auctionCreated, setAuctionCreated] = useState(false)

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

  // Function to predict price using ML API
  const predictPrice = useCallback(async () => {
    if (!form.category || !form.original_price || !form.used_duration || !form.user_lifespan || !form.condition || !form.build_quality) {
      return
    }

    setPriceLoading(true)
    try {
      const response = await fetch("/api/predict-price", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          original_price: Number(form.original_price),
          used_duration: Number(form.used_duration),
          user_lifespan: Number(form.user_lifespan),
          condition: Number(form.condition),
          build_quality: Number(form.build_quality),
          brand: form.brand,
          usage_pattern: form.usage_pattern,
          expiry_years: Number(form.expiry_years)
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success" && data.predicted_price) {
          setPredictedPrice(data.predicted_price)
          setUsePredictedPrice(true)
        } else {
          console.error("Price prediction API returned error:", data.error)
          setPredictedPrice(null)
        }
      } else {
        console.error("Price prediction API failed with status:", response.status)
        const errorData = await response.json().catch(() => ({ error: 'API request failed' }))
        console.error("Error details:", errorData.error)
        setPredictedPrice(null)
      }
    } catch (error) {
      console.error("Error predicting price:", error)
    } finally {
      setPriceLoading(false)
    }
  }, [form])

  // Auto-predict price when required fields are filled
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (form.category && form.original_price && form.used_duration && form.user_lifespan && form.condition && form.build_quality) {
        predictPrice()
        // Reset price confirmation when form changes
        setPriceConfirmed(false)
        setConfirmedPriceDetails(null)
      }
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(debounceTimer)
  }, [form.category, form.original_price, form.used_duration, form.user_lifespan, form.condition, form.build_quality, predictPrice])

  // Function to confirm price selection
  const confirmPrice = useCallback(() => {
    if (usePredictedPrice && predictedPrice) {
      setConfirmedPriceDetails({
        price: predictedPrice,
        source: "ml_predicted",
        predictedPrice: predictedPrice
      })
    } else if (!usePredictedPrice && customPrice) {
      setConfirmedPriceDetails({
        price: Number(customPrice),
        source: "user_provided",
        predictedPrice: predictedPrice || undefined
      })
    }
    setPriceConfirmed(true)
  }, [usePredictedPrice, predictedPrice, customPrice])

  // Function to create auction for the item
  const createAuction = useCallback(async () => {
    console.log("createAuction called", { confirmedPriceDetails, created, auctionDuration })
    
    if (!confirmedPriceDetails || !created) {
      console.log("Early return - missing data:", { confirmedPriceDetails: !!confirmedPriceDetails, created: !!created })
      alert("Missing required data. Please ensure the item is created and price is confirmed.")
      return
    }
    
    setCreatingAuction(true)
    try {
      console.log("Getting user session...")
      // Get current user session for created_by
      const sessionResponse = await fetch("/api/auth/session")
      const session = await sessionResponse.json()
      const userEmail = session?.user?.email || "anonymous@example.com"
      console.log("User email:", userEmail)
      
      const auctionData = {
        item_id: created.id,
        created_by: userEmail,
        starting_price: Math.max(1, Math.floor(confirmedPriceDetails.price * 0.5)), // Start at 50% of confirmed price
        auction_duration_hours: parseInt(auctionDuration)
      }
      
      console.log("Auction data:", auctionData)
      
      const response = await fetch("/api/auctions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auctionData)
      })
      
      console.log("Response status:", response.status)
      const result = await response.json()
      console.log("Response data:", result)
      
      if (response.ok && result.status === "success") {
        setShowAuctionDialog(false)
        setAuctionCreated(true)
        alert("Auction created successfully! Your item is now available for bidding.")
      } else {
        throw new Error(result.error || "Failed to create auction")
      }
    } catch (error) {
      console.error("Error creating auction:", error)
      alert(`Failed to create auction: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setCreatingAuction(false)
    }
  }, [confirmedPriceDetails, created, auctionDuration])

  // Reset confirmation when price options change
  useEffect(() => {
    if (priceConfirmed) {
      setPriceConfirmed(false)
      setConfirmedPriceDetails(null)
    }
  }, [usePredictedPrice, customPrice])

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
    
    // Require price confirmation
    if (!priceConfirmed || !confirmedPriceDetails) return false
    
    return true
  }, [form, priceConfirmed, confirmedPriceDetails])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !confirmedPriceDetails) return
    
    setIsSubmitting(true)
    try {
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
          current_price: confirmedPriceDetails.price,
          price_source: confirmedPriceDetails.source,
          predicted_price: confirmedPriceDetails.predictedPrice,
        }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || errorData.message || 'Failed to create item'
        alert(`Error: ${errorMessage}`)
        return
      }
      
      const responseData = await res.json()
      const item: Item = responseData.item || responseData
      
      if (!item || !item.id) {
        alert("Item created but no data returned")
        return
      }
      
      setCreated(item)
      // Generate QR code with just the item ID instead of full URL
      const dataUrl = await QRCode.toDataURL(item.id, { margin: 1, scale: 6 })
      setQrDataUrl(dataUrl)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert("Failed to create item")
    } finally {
      setIsSubmitting(false)
    }
  }, [confirmedPriceDetails, isSubmitting, form])

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
      <AppNav />
      <section className="container mx-auto max-w-7xl py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <Card className="border-[#9ac37e]/20 shadow-md hover:shadow-lg transition-shadow duration-200 w-full">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-[#3e5f44] text-lg sm:text-xl font-bold">Report e‑waste</CardTitle>
                  <CardDescription className="text-[#3e5f44]/70 text-sm sm:text-base">Fill in the details to generate a QR tag for this item.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/auctions/my-auctions', '_blank')}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  My Auctions
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form className="grid gap-4" onSubmit={onSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">Item name</Label>
                  <Input 
                    id="name" 
                    value={form.name} 
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                    placeholder="e.g. Dell Latitude E5450"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
                  <Textarea 
                    id="desc" 
                    value={form.description} 
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} 
                    placeholder="Condition, asset tag, notes..." 
                    className="w-full min-h-[80px] resize-y"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
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
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Disposition</Label>
                  <Select value={form.disposition} onValueChange={(v) => setForm((f) => ({ ...f, disposition: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select disposition (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recyclable">Recyclable</SelectItem>
                      <SelectItem value="Reusable">Reusable</SelectItem>
                      <SelectItem value="Hazardous">Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Brand</Label>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={brandOpen}
                        className="w-full justify-between h-10"
                      >
                        <span className="truncate">
                          {form.brand
                            ? brands.find((brand) => brand === form.brand)
                            : "Select brand..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search brand..." className="h-9" />
                        <CommandList className="max-h-60">
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
                                className="cursor-pointer"
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
                  <Label className="text-sm font-medium">Build Quality (1=Low, 5=High)</Label>
                  <Select value={form.build_quality} onValueChange={(v) => setForm((f) => ({ ...f, build_quality: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select build quality" /></SelectTrigger>
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
                  <Label htmlFor="user_lifespan">Expected Lifespan (in years)</Label>
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
                  <Label htmlFor="expiry_years">Expiry (in years)</Label>
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
                    placeholder="Auto-filled from expected lifespan or enter manually" 
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
                  <Label htmlFor="original_price">Cost Price (₹)</Label>
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
                  <Label htmlFor="used_duration">Usage Duration (in years)</Label>
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

                {/* ML Price Prediction Section */}
                {predictedPrice !== null && (
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-blue-700 dark:text-blue-300">
                          🤖 Predicted Price (ML-based)
                        </Label>
                        {priceLoading && <div className="text-sm text-muted-foreground">Calculating...</div>}
                      </div>
                      
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{predictedPrice.toLocaleString()}
                      </div>
                      
                      {!priceConfirmed ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="use-predicted"
                              name="price-option"
                              checked={usePredictedPrice}
                              onChange={() => setUsePredictedPrice(true)}
                              className="w-4 h-4 text-green-600"
                            />
                            <Label htmlFor="use-predicted" className="cursor-pointer">
                              Use ML predicted price (₹{predictedPrice.toLocaleString()})
                            </Label>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="use-custom"
                                name="price-option"
                                checked={!usePredictedPrice}
                                onChange={() => setUsePredictedPrice(false)}
                                className="w-4 h-4 text-green-600"
                              />
                              <Label htmlFor="use-custom" className="cursor-pointer">
                                Set my own price
                              </Label>
                            </div>
                            
                            {!usePredictedPrice && (
                              <div className="ml-6">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Enter your price"
                                  value={customPrice}
                                  onChange={(e) => setCustomPrice(e.target.value)}
                                  className="max-w-xs"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-center pt-2">
                            <Button 
                              type="button"
                              onClick={confirmPrice}
                              disabled={(!usePredictedPrice && !customPrice) || (usePredictedPrice && !predictedPrice)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                            >
                              Confirm Price Selection
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Show confirmed price details */}
                          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">Price Confirmed</span>
                              </div>
                              <Button 
                                type="button" 
                                onClick={() => {
                                  setPriceConfirmed(false)
                                  setConfirmedPriceDetails(null)
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                Change
                              </Button>
                            </div>
                            <div className="mt-2">
                              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                ₹{confirmedPriceDetails?.price.toLocaleString()}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                {confirmedPriceDetails?.source === "ml_predicted" && "🤖 Using ML Predicted Price"}
                                {confirmedPriceDetails?.source === "user_provided" && "👤 Using Your Custom Price"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        💡 Our AI considers category, condition, age, brand, and market trends to estimate current value.
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={!canSubmit || isSubmitting} 
                  className="bg-[#3e5f44] hover:bg-[#4a6e50] disabled:opacity-50 text-white w-full sm:w-auto transition-colors duration-200"
                >
                  {isSubmitting ? "Creating..." : !priceConfirmed ? "Please confirm price first" : "Create & generate QR"}
                </Button>
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
                  
                  {/* Auction Creation Option - Only show after item is successfully created */}
                  {confirmedPriceDetails && !auctionCreated ? (
                    <div className="mt-4 p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/50">
                      <div className="text-sm text-green-700 dark:text-green-300 mb-2">
                        💰 Want to sell this item through auction?
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowAuctionDialog(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50"
                      >
                        <Gavel className="h-4 w-4" />
                        Create Auction
                      </Button>
                    </div>
                  ) : auctionCreated ? (
                    <div className="mt-4 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        ✅ Auction created successfully! Check "My Auctions" to track bidding.
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-muted-foreground text-sm">Submit the form to see the QR code here.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Auction Creation Dialog */}
      <Dialog open={showAuctionDialog} onOpenChange={setShowAuctionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Create Auction
            </DialogTitle>
            <DialogDescription>
              Set up an auction for your item. Buyers can bid starting from 50% of your confirmed price.
            </DialogDescription>
          </DialogHeader>
          
          {confirmedPriceDetails && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="text-sm font-medium">Item: {form.name}</div>
                <div className="text-sm text-muted-foreground">Your Price: ₹{confirmedPriceDetails.price.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Starting Bid: ₹{Math.max(1, Math.floor(confirmedPriceDetails.price * 0.5)).toLocaleString()}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auction-duration">Auction Duration</Label>
                <Select value={auctionDuration} onValueChange={setAuctionDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="48">48 Hours</SelectItem>
                    <SelectItem value="72">3 Days</SelectItem>
                    <SelectItem value="168">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAuctionDialog(false)}
              disabled={creatingAuction}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("Create Auction button clicked!")
                createAuction()
              }}
              disabled={creatingAuction}
              className="bg-[#3e5f44] hover:bg-[#4a6e50]"
            >
              {creatingAuction ? "Creating..." : "Create Auction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
