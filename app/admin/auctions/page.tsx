"use client"

import { useEffect, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Timer, DollarSign, Users, TrendingUp, Gavel, Activity } from "lucide-react"

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
  created_at: string
  updated_at: string
}

type Bid = {
  id: number
  auction_id: number
  vendor_id: string
  bid_amount: number
  bid_time: string
  status: string
}

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [allAuctions, setAllAuctions] = useState<Auction[]>([])
  const [recentBids, setRecentBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const activeResponse = await fetch('/api/auctions/active')
      
      if (!activeResponse.ok) {
        throw new Error("Failed to load auction data")
      }

      const activeData = await activeResponse.json()
      setAuctions(activeData.auctions || [])

      // Get recent bids for active auctions
      if (activeData.auctions?.length > 0) {
        const bidsPromises = activeData.auctions.map((auction: Auction) =>
          fetch(`/api/auctions/${auction.id}`).then(res => res.json())
        )
        
        const auctionDetails = await Promise.all(bidsPromises)
        const allBids = auctionDetails.flatMap(detail => detail.bids || [])
        const sortedBids = allBids.sort((a, b) => new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime())
        setRecentBids(sortedBids.slice(0, 10)) // Show last 10 bids
      }

    } catch (error) {
      console.error('Error loading auction data:', error)
      setError('Failed to load auction data')
    } finally {
      setIsLoading(false)
    }
  }

  const processExpiredAuctions = async () => {
    try {
      const response = await fetch('/api/auctions/process-expired', {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadData() // Refresh data
      }
    } catch (error) {
      console.error('Error processing expired auctions:', error)
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

  const totalActiveAuctions = auctions.length
  const totalCurrentValue = auctions.reduce((sum, auction) => sum + (auction.current_highest_bid || auction.starting_price), 0)
  const averageBidValue = totalActiveAuctions > 0 ? Math.round(totalCurrentValue / totalActiveAuctions) : 0
  const auctionsEndingSoon = auctions.filter(a => {
    const remaining = new Date(a.end_time).getTime() - new Date().getTime()
    return remaining > 0 && remaining < 2 * 60 * 60 * 1000 // Less than 2 hours
  }).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
        <AppNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">Loading auction dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <AppNav />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Auction Dashboard</h1>
            <p className="text-slate-600 mt-2">Monitor all auction activity across the platform</p>
          </div>
          <Button onClick={processExpiredAuctions} variant="outline">
            Process Expired Auctions
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
              <Gavel className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{totalActiveAuctions}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Current Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">₹{totalCurrentValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Bid Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">₹{averageBidValue}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ending Soon</CardTitle>
              <Timer className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{auctionsEndingSoon}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active Auctions</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {auctions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-slate-500">No active auctions currently.</div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {auctions.map((auction) => (
                  <Card key={auction.id} className="border-emerald-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Auction #{auction.id}</CardTitle>
                          <CardDescription>
                            Item: {auction.item_id} • Created by: {auction.created_by}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Timer className="h-3 w-3 mr-1" />
                            {formatTimeRemaining(auction.end_time)}
                          </Badge>
                          {new Date(auction.end_time).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000 && (
                            <Badge variant="destructive">Ending Soon</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Starting Price:</span>
                          <div className="font-medium">₹{auction.starting_price}</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Current Highest:</span>
                          <div className="font-bold text-emerald-600">
                            ₹{auction.current_highest_bid || auction.starting_price}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Duration:</span>
                          <div>{auction.auction_duration_hours}h</div>
                        </div>
                        <div>
                          <span className="text-slate-600">Started:</span>
                          <div>{new Date(auction.start_time).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/auctions/${auction.id}`, '_blank')}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Bidding Activity
                </CardTitle>
                <CardDescription>Latest bids across all active auctions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentBids.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">No recent bidding activity.</div>
                ) : (
                  <div className="space-y-3">
                    {recentBids.map((bid) => (
                      <div key={bid.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Auction #{bid.auction_id}</Badge>
                          <span className="text-sm text-slate-600">
                            Vendor: {bid.vendor_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-600">₹{bid.bid_amount}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(bid.bid_time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
