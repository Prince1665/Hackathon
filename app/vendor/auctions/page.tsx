"use client"

import { useEffect, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"

type Auction = {
  id: string
  item_id: string
  created_by: string
  starting_price: number
  current_highest_bid?: number
  current_highest_bidder?: string
  status: "active" | "completed" | "cancelled"
  duration_hours: number
  start_time: string
  end_time: string
  created_at: string
}

type Bid = {
  id: string
  auction_id: string
  vendor_id: string
  amount: number
  bid_time: string
  status: "active" | "outbid" | "winning"
}

export default function VendorAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [myBids, setMyBids] = useState<Bid[]>([])
  const [bidAmounts, setBidAmounts] = useState<{ [auctionId: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState<{ [auctionId: string]: boolean }>({})
  const [error, setError] = useState("")
  const [bidError, setBidError] = useState<{ [auctionId: string]: string }>({})
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null)

  useEffect(() => {
    fetchData()
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData.user)
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err)
    }
  }

  const fetchData = async () => {
    try {
      // Fetch active auctions
      const auctionsResponse = await fetch("/api/auctions?status=active")
      if (!auctionsResponse.ok) throw new Error("Failed to fetch auctions")

      const auctionsData = await auctionsResponse.json()
      setAuctions(auctionsData)

      // Fetch my vendor-specific bids
      const myBidsResponse = await fetch("/api/vendor/bids")
      if (myBidsResponse.ok) {
        const myBidsData = await myBidsResponse.json()
        setMyBids(myBidsData)
      } else {
        // Fallback: fetch all bids and filter (less efficient but works)
        const bidPromises = auctionsData.map(async (auction: Auction) => {
          const bidResponse = await fetch(`/api/auctions/${auction.id}/bids`)
          if (bidResponse.ok) {
            return await bidResponse.json()
          }
          return []
        })

        const allBids = await Promise.all(bidPromises)
        const flatBids = allBids.flat()
        setMyBids(flatBids)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleBidAmountChange = (auctionId: string, value: string) => {
    setBidAmounts(prev => ({ ...prev, [auctionId]: value }))
    // Clear any previous error for this auction
    setBidError(prev => ({ ...prev, [auctionId]: "" }))
  }

  const placeBid = async (auction: Auction) => {
    const amount = bidAmounts[auction.id]
    if (!amount) {
      setBidError(prev => ({ ...prev, [auction.id]: "Please enter a bid amount" }))
      return
    }

    const bidAmount = Number(amount)
    const minBid = auction.current_highest_bid 
      ? auction.current_highest_bid + 50 
      : auction.starting_price + 50

    if (bidAmount < minBid) {
      setBidError(prev => ({ 
        ...prev, 
        [auction.id]: `Minimum bid is ₹${minBid}` 
      }))
      return
    }

    setBidding(prev => ({ ...prev, [auction.id]: true }))
    setBidError(prev => ({ ...prev, [auction.id]: "" }))

    try {
      const response = await fetch(`/api/auctions/${auction.id}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: bidAmount }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to place bid")
      }

      // Clear the bid amount and refresh data
      setBidAmounts(prev => ({ ...prev, [auction.id]: "" }))
      await fetchData()
    } catch (err) {
      setBidError(prev => ({ 
        ...prev, 
        [auction.id]: err instanceof Error ? err.message : "Failed to place bid" 
      }))
    } finally {
      setBidding(prev => ({ ...prev, [auction.id]: false }))
    }
  }

  const getTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    
    if (now > end) return "Expired"
    return `${formatDistanceToNow(end)} remaining`
  }

  const getMinBid = (auction: Auction) => {
    return auction.current_highest_bid 
      ? auction.current_highest_bid + 50 
      : auction.starting_price + 50
  }

  const getMyBidForAuction = (auctionId: string) => {
    return myBids.find(bid => bid.auction_id === auctionId)
  }

  const activeAuctions = auctions.filter(a => new Date() < new Date(a.end_time))
  const myWinningBids = myBids.filter(bid => bid.status === "winning")
  const myActiveBids = myBids.filter(bid => bid.status === "active" || bid.status === "outbid")

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading auctions...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
      <AppNav />
      <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 max-w-7xl">
        {/* Navigation breadcrumb */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/vendor/scan'}
            className="text-[#3e5f44] hover:bg-[#3e5f44]/10"
          >
            ← Back to Vendor Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#3e5f44] mb-2">Vendor Auctions</h1>
              <p className="text-[#3e5f44]/70">Browse and bid on available e-waste items</p>
            </div>
            {currentUser && (
              <div className="text-right">
                <p className="text-sm text-[#3e5f44]/60">Logged in as</p>
                <p className="font-semibold text-[#3e5f44]">{currentUser.name}</p>
                <p className="text-sm text-[#3e5f44]/70">{currentUser.email}</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto bg-[#9ac37e]/10 border-2 border-[#3e5f44] rounded-none">
            <TabsTrigger value="browse" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Browse Auctions ({activeAuctions.length})</TabsTrigger>
            <TabsTrigger value="winning" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Winning Bids ({myWinningBids.length})</TabsTrigger>
            <TabsTrigger value="mybids" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">My Bids ({myActiveBids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {activeAuctions.length === 0 ? (
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="text-center py-12">
                  <p className="text-[#3e5f44]/70">No active auctions available</p>
                </CardContent>
              </Card>
            ) : (
              activeAuctions.map((auction) => {
                const myBid = getMyBidForAuction(auction.id)
                const minBid = getMinBid(auction)
                
                return (
                  <Card key={auction.id} className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-[#3e5f44] text-lg sm:text-xl font-bold">Item ID: {auction.item_id}</CardTitle>
                          <CardDescription className="text-[#3e5f44]/70">
                            Started {formatDistanceToNow(new Date(auction.start_time))} ago
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-[#9ac37e] text-white hover:bg-[#8bb56f]">Active</Badge>
                          <div className="text-sm text-[#3e5f44]/60 mt-1">
                            {getTimeRemaining(auction.end_time)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Starting Price</h4>
                          <p className="text-lg font-bold text-[#3e5f44]">₹{auction.starting_price}</p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Current Highest</h4>
                          <p className="text-lg font-bold text-[#9ac37e]">
                            {auction.current_highest_bid ? `₹${auction.current_highest_bid}` : "No bids"}
                          </p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Minimum Bid</h4>
                          <p className="text-lg font-bold text-[#3e5f44]">₹{minBid}</p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">My Status</h4>
                          {myBid ? (
                            <Badge variant={myBid.status === "winning" ? "default" : "secondary"}>
                              {myBid.status === "winning" ? "Winning" : "Outbid"}
                            </Badge>
                          ) : (
                            <p className="text-sm text-[#3e5f44]/60">Not bidding</p>
                          )}
                        </div>
                      </div>

                      {myBid && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-[#9ac37e]/10 to-transparent border border-[#9ac37e]/30 rounded-lg">
                          <p className="text-sm text-[#3e5f44]">
                            Your current bid: ₹{myBid.amount} ({myBid.status})
                          </p>
                        </div>
                      )}

                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`bid-${auction.id}`}>Your Bid (₹)</Label>
                          <Input
                            id={`bid-${auction.id}`}
                            type="number"
                            min={minBid}
                            step="1"
                            placeholder={`Minimum ₹${minBid}`}
                            value={bidAmounts[auction.id] || ""}
                            onChange={(e) => handleBidAmountChange(auction.id, e.target.value)}
                            disabled={bidding[auction.id]}
                          />
                          {bidError[auction.id] && (
                            <p className="text-sm text-red-600 mt-1">{bidError[auction.id]}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => placeBid(auction)}
                          disabled={bidding[auction.id] || !bidAmounts[auction.id]}
                          className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white"
                        >
                          {bidding[auction.id] ? "Placing Bid..." : "Place Bid"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="winning" className="space-y-4">
            {myWinningBids.length === 0 ? (
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="text-center py-12">
                  <p className="text-[#3e5f44]/70">No winning bids yet</p>
                </CardContent>
              </Card>
            ) : (
              myWinningBids.map((bid) => {
                const auction = auctions.find(a => a.id === bid.auction_id)
                if (!auction) return null
                
                return (
                  <Card key={bid.id} className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-[#3e5f44] text-lg sm:text-xl font-bold">Item ID: {auction.item_id}</CardTitle>
                          <CardDescription className="text-[#3e5f44]/70">
                            Bid placed {formatDistanceToNow(new Date(bid.bid_time))} ago
                          </CardDescription>
                        </div>
                        <Badge className="bg-[#9ac37e] text-white hover:bg-[#8bb56f]">Winning</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Your Bid</h4>
                          <p className="text-lg font-bold text-[#9ac37e]">₹{bid.amount}</p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Starting Price</h4>
                          <p className="text-lg font-bold text-[#3e5f44]">₹{auction.starting_price}</p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Time Remaining</h4>
                          <p className="text-lg font-bold text-[#3e5f44]">{getTimeRemaining(auction.end_time)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="mybids" className="space-y-4">
            {myActiveBids.length === 0 ? (
              <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="text-center py-12">
                  <p className="text-[#3e5f44]/70">No active bids</p>
                </CardContent>
              </Card>
            ) : (
              myActiveBids.map((bid) => {
                const auction = auctions.find(a => a.id === bid.auction_id)
                if (!auction) return null
                
                return (
                  <Card key={bid.id} className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-[#3e5f44] text-lg sm:text-xl font-bold">Item ID: {auction.item_id}</CardTitle>
                          <CardDescription className="text-[#3e5f44]/70">
                            Bid placed {formatDistanceToNow(new Date(bid.bid_time))} ago
                          </CardDescription>
                        </div>
                        <Badge variant={bid.status === "outbid" ? "destructive" : "secondary"}
                               className={bid.status === "winning" ? "bg-[#9ac37e] text-white hover:bg-[#8bb56f]" : ""}>
                          {bid.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Your Bid</h4>
                          <p className="text-lg font-bold text-[#3e5f44]">₹{bid.amount}</p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Current Highest</h4>
                          <p className="text-lg font-bold text-[#9ac37e]">
                            ₹{auction.current_highest_bid || "No bids"}
                          </p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Starting Price</h4>
                          <p className="text-lg font-bold text-[#3e5f44]">₹{auction.starting_price}</p>
                        </div>
                        <div className="rounded-md border border-[#9ac37e]/30 p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent">
                          <h4 className="font-semibold text-sm text-[#3e5f44]/70">Time Remaining</h4>
                          <p className="text-lg font-bold text-[#3e5f44]">{getTimeRemaining(auction.end_time)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
