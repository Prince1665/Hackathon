"use client"

import { useEffect, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Timer, DollarSign, Gavel, TrendingUp } from "lucide-react"

type Auction = {
  id: number
  item_id: string
  created_by: string
  starting_price: number
  current_highest_bid: number
  auction_duration_hours: number
  start_time: string
  end_time: string
  status: "active" | "completed" | "cancelled"
  winning_vendor_id?: string | null
  winning_bid?: number | null
}

type Bid = {
  id: number
  auction_id: number
  vendor_id: string
  bid_amount: number
  bid_time: string
  status: string
}

export default function VendorAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBidding, setIsBidding] = useState(false)
  const [vendorId] = useState("vendor123") // Replace with actual vendor ID from session

  useEffect(() => {
    loadAuctions()
    const interval = setInterval(loadAuctions, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadAuctions = async () => {
    setError(null)
    
    try {
      const response = await fetch('/api/auctions/active')
      
      if (!response.ok) {
        throw new Error("Failed to load auctions")
      }

      const data = await response.json()
      setAuctions(data.auctions || [])
    } catch (error) {
      console.error('Error loading auctions:', error)
      setError('Failed to load auctions')
    } finally {
      setIsLoading(false)
    }
  }

  const placeBid = async () => {
    if (!selectedAuction || !bidAmount || Number(bidAmount) <= selectedAuction.current_highest_bid) {
      return
    }

    setIsBidding(true)
    try {
      const response = await fetch('/api/auctions/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auction_id: selectedAuction.id,
          vendor_id: vendorId,
          bid_amount: Number(bidAmount)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place bid')
      }

      setBidAmount("")
      setSelectedAuction(null)
      await loadAuctions()
    } catch (error) {
      console.error('Error placing bid:', error)
      setError(error instanceof Error ? error.message : 'Failed to place bid')
    } finally {
      setIsBidding(false)
    }
  }

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    const remaining = end.getTime() - now.getTime()

    if (remaining <= 0) return "Ended"

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const getMinimumBid = (auction: Auction) => {
    return auction.current_highest_bid > 0 ? auction.current_highest_bid + 50 : auction.starting_price
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
        <AppNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">Loading auctions...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <AppNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Available Auctions</h1>
          <p className="text-slate-600 mt-2">Browse and bid on available e-waste items</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700">{error}</div>
            </CardContent>
          </Card>
        )}

        {auctions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-slate-500">
                No active auctions available at the moment.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => {
              const timeRemaining = formatTimeRemaining(auction.end_time)
              const isEndingSoon = new Date(auction.end_time).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000
              
              return (
                <Card key={auction.id} className="border-emerald-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Auction #{auction.id}</CardTitle>
                        <CardDescription>Item: {auction.item_id}</CardDescription>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={`text-xs ${isEndingSoon ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          <Timer className="h-3 w-3 mr-1" />
                          {timeRemaining}
                        </Badge>
                        {isEndingSoon && (
                          <Badge variant="destructive" className="text-xs">
                            Ending Soon!
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Starting Price:</span>
                      <span className="font-medium">₹{auction.starting_price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Current Highest:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{auction.current_highest_bid || auction.starting_price}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Minimum Next Bid:</span>
                      <span className="font-medium text-blue-600">
                        ₹{getMinimumBid(auction)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Ends:</span>
                      <span>{new Date(auction.end_time).toLocaleDateString()} {new Date(auction.end_time).toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setSelectedAuction(auction)
                          setBidAmount(getMinimumBid(auction).toString())
                        }}
                        disabled={timeRemaining === "Ended"}
                      >
                        <Gavel className="h-4 w-4 mr-2" />
                        {timeRemaining === "Ended" ? "Auction Ended" : "Place Bid"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Place Bid Dialog */}
        <AlertDialog open={!!selectedAuction} onOpenChange={(open) => !open && setSelectedAuction(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Place Bid on Auction #{selectedAuction?.id}</AlertDialogTitle>
              <AlertDialogDescription>
                Current highest bid: ₹{selectedAuction?.current_highest_bid || selectedAuction?.starting_price}
                <br />
                Minimum bid required: ₹{selectedAuction ? getMinimumBid(selectedAuction) : 0}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bid-amount">Your Bid Amount (₹)</Label>
                <Input
                  id="bid-amount"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid"
                  min={selectedAuction ? getMinimumBid(selectedAuction) : 0}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Minimum increment: ₹50
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={placeBid}
                disabled={!bidAmount || Number(bidAmount) < (selectedAuction ? getMinimumBid(selectedAuction) : 0) || isBidding}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isBidding ? "Placing Bid..." : `Bid ₹${bidAmount}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
