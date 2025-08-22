"use client"

import { useEffect, useState } from "react"
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch active auctions
      const auctionsResponse = await fetch("/api/auctions?status=active")
      if (!auctionsResponse.ok) throw new Error("Failed to fetch auctions")
      
      const auctionsData = await auctionsResponse.json()
      setAuctions(auctionsData)

      // Fetch all my bids across auctions
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Auctions</h1>
          <p className="text-gray-600">Browse and bid on available e-waste items</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Browse Auctions ({activeAuctions.length})</TabsTrigger>
            <TabsTrigger value="winning">Winning Bids ({myWinningBids.length})</TabsTrigger>
            <TabsTrigger value="mybids">My Bids ({myActiveBids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {activeAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No active auctions available</p>
                </CardContent>
              </Card>
            ) : (
              activeAuctions.map((auction) => {
                const myBid = getMyBidForAuction(auction.id)
                const minBid = getMinBid(auction)
                
                return (
                  <Card key={auction.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Item ID: {auction.item_id}</CardTitle>
                          <CardDescription>
                            Started {formatDistanceToNow(new Date(auction.start_time))} ago
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-500">Active</Badge>
                          <div className="text-sm text-gray-500 mt-1">
                            {getTimeRemaining(auction.end_time)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                          <p className="text-lg">₹{auction.starting_price}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Current Highest</h4>
                          <p className="text-lg font-bold text-green-600">
                            {auction.current_highest_bid ? `₹${auction.current_highest_bid}` : "No bids"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Minimum Bid</h4>
                          <p className="text-lg font-bold text-blue-600">₹{minBid}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">My Status</h4>
                          {myBid ? (
                            <Badge variant={myBid.status === "winning" ? "default" : "secondary"}>
                              {myBid.status === "winning" ? "Winning" : "Outbid"}
                            </Badge>
                          ) : (
                            <p className="text-sm text-gray-500">Not bidding</p>
                          )}
                        </div>
                      </div>

                      {myBid && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
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
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No winning bids yet</p>
                </CardContent>
              </Card>
            ) : (
              myWinningBids.map((bid) => {
                const auction = auctions.find(a => a.id === bid.auction_id)
                if (!auction) return null
                
                return (
                  <Card key={bid.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Item ID: {auction.item_id}</CardTitle>
                          <CardDescription>
                            Bid placed {formatDistanceToNow(new Date(bid.bid_time))} ago
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500">Winning</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Your Bid</h4>
                          <p className="text-lg font-bold text-green-600">₹{bid.amount}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                          <p className="text-lg">₹{auction.starting_price}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Time Remaining</h4>
                          <p className="text-lg">{getTimeRemaining(auction.end_time)}</p>
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
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No active bids</p>
                </CardContent>
              </Card>
            ) : (
              myActiveBids.map((bid) => {
                const auction = auctions.find(a => a.id === bid.auction_id)
                if (!auction) return null
                
                return (
                  <Card key={bid.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Item ID: {auction.item_id}</CardTitle>
                          <CardDescription>
                            Bid placed {formatDistanceToNow(new Date(bid.bid_time))} ago
                          </CardDescription>
                        </div>
                        <Badge variant={bid.status === "outbid" ? "destructive" : "secondary"}>
                          {bid.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Your Bid</h4>
                          <p className="text-lg font-bold">₹{bid.amount}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Current Highest</h4>
                          <p className="text-lg font-bold text-green-600">
                            ₹{auction.current_highest_bid || "No bids"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                          <p className="text-lg">₹{auction.starting_price}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600">Time Remaining</h4>
                          <p className="text-lg">{getTimeRemaining(auction.end_time)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
