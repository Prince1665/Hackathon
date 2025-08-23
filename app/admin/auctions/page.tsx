"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppNav } from "@/components/app-nav"
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

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [bids, setBids] = useState<{ [auctionId: string]: Bid[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/auctions")
      if (!response.ok) throw new Error("Failed to fetch auctions")
      
      const auctionsData = await response.json()
      setAuctions(auctionsData)
      
      // Fetch bids with vendor info for each auction
      const bidPromises = auctionsData.map(async (auction: Auction) => {
        const bidResponse = await fetch(`/api/auctions/${auction.id}/bids?include_vendor=true`)
        if (bidResponse.ok) {
          const auctionBids = await bidResponse.json()
          return { auctionId: auction.id, bids: auctionBids }
        }
        return { auctionId: auction.id, bids: [] }
      })
      
      const bidResults = await Promise.all(bidPromises)
      const bidMap: { [auctionId: string]: Bid[] } = {}
      bidResults.forEach(({ auctionId, bids }) => {
        bidMap[auctionId] = bids
      })
      setBids(bidMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "completed": return "bg-blue-500"
      case "cancelled": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    
    if (now > end) return "Expired"
    return `${formatDistanceToNow(end)} remaining`
  }

  const getTotalRevenue = (auctions: Auction[]) => {
    return auctions
      .filter(a => a.status === "completed" && a.current_highest_bid)
      .reduce((sum, a) => sum + (a.current_highest_bid || 0), 0)
  }

  const activeAuctions = auctions.filter(a => a.status === "active")
  const completedAuctions = auctions.filter(a => a.status === "completed")
  const cancelledAuctions = auctions.filter(a => a.status === "cancelled")

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
        <section className="container mx-auto py-4 sm:py-8 px-4 max-w-7xl">
          <div className="text-center py-12 text-[#3e5f44]">Loading auction data...</div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
      <AppNav />
      <section className="container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#3e5f44] mb-2">Admin - Auction Management</h1>
          <p className="text-[#3e5f44]/70">Monitor and manage all auction activities</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3e5f44]/70">Total Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#3e5f44]">{auctions.length}</div>
            </CardContent>
          </Card>

          <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3e5f44]/70">Active Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#9ac37e]">{activeAuctions.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3e5f44]/70">Completed Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#3e5f44]">{completedAuctions.length}</div>
            </CardContent>
          </Card>

          <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#3e5f44]/70">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#9ac37e]">₹{getTotalRevenue(completedAuctions).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto bg-[#9ac37e]/10 border-2 border-[#3e5f44] rounded-none">
            <TabsTrigger value="active" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Active ({activeAuctions.length})</TabsTrigger>
            <TabsTrigger value="completed" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Completed ({completedAuctions.length})</TabsTrigger>
            <TabsTrigger value="cancelled" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">Cancelled ({cancelledAuctions.length})</TabsTrigger>
            <TabsTrigger value="all" className="border-2 border-[#3e5f44] rounded-none shadow-sm hover:border-[#2d5016] hover:bg-[#9ac37e]/20">All Auctions ({auctions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No active auctions</p>
                </CardContent>
              </Card>
            ) : (
              activeAuctions.map((auction) => (
                <Card key={auction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Auction #{auction.id.slice(0, 8)}...</CardTitle>
                        <CardDescription>
                          Item: {auction.item_id} • Created by: {auction.created_by.slice(0, 8)}...
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(auction.status)}>
                          {auction.status}
                        </Badge>
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
                        <h4 className="font-semibold text-sm text-gray-600">Total Bids</h4>
                        <p className="text-lg">{bids[auction.id]?.length || 0}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Duration</h4>
                        <p className="text-lg">{auction.duration_hours}h</p>
                      </div>
                    </div>
                    
                    {bids[auction.id] && bids[auction.id].length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm text-gray-600 mb-2">Recent Bids</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {bids[auction.id].slice(0, 5).map((bid) => (
                            <div key={bid.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                              <span>Vendor: {bid.vendor_id.slice(0, 8)}...</span>
                              <span className="font-semibold">₹{bid.amount}</span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(bid.bid_time))} ago
                              </span>
                              <Badge variant={bid.status === "winning" ? "default" : "secondary"}>
                                {bid.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No completed auctions yet</p>
                </CardContent>
              </Card>
            ) : (
              completedAuctions.map((auction) => (
                <Card key={auction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Auction #{auction.id.slice(0, 8)}...</CardTitle>
                        <CardDescription>
                          Item: {auction.item_id} • Completed {formatDistanceToNow(new Date(auction.end_time))} ago
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(auction.status)}>
                        {auction.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                        <p className="text-lg">₹{auction.starting_price}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Final Price</h4>
                        <p className="text-lg font-bold text-green-600">
                          {auction.current_highest_bid ? `₹${auction.current_highest_bid}` : "No bids"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Winner</h4>
                        <p className="text-lg">
                          {auction.current_highest_bidder ? 
                            `${auction.current_highest_bidder.slice(0, 8)}...` : 
                            "No winner"
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Total Bids</h4>
                        <p className="text-lg">{bids[auction.id]?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No cancelled auctions</p>
                </CardContent>
              </Card>
            ) : (
              cancelledAuctions.map((auction) => (
                <Card key={auction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Auction #{auction.id.slice(0, 8)}...</CardTitle>
                        <CardDescription>
                          Item: {auction.item_id} • Cancelled
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(auction.status)}>
                        {auction.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                        <p className="text-lg">₹{auction.starting_price}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Total Bids</h4>
                        <p className="text-lg">{bids[auction.id]?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {auctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No auctions found</p>
                </CardContent>
              </Card>
            ) : (
              auctions.map((auction) => (
                <Card key={auction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Auction #{auction.id.slice(0, 8)}...</CardTitle>
                        <CardDescription>
                          Item: {auction.item_id} • Created {formatDistanceToNow(new Date(auction.created_at))} ago
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(auction.status)}>
                        {auction.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                        <p className="text-lg">₹{auction.starting_price}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Current/Final</h4>
                        <p className="text-lg font-bold text-green-600">
                          {auction.current_highest_bid ? `₹${auction.current_highest_bid}` : "No bids"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Total Bids</h4>
                        <p className="text-lg">{bids[auction.id]?.length || 0}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Duration</h4>
                        <p className="text-lg">{auction.duration_hours}h</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Time Status</h4>
                        <p className="text-sm">
                          {auction.status === "active" ? getTimeRemaining(auction.end_time) : "Ended"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
