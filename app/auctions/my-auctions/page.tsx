"use client"

import { useEffect, useState, useMemo } from "react"
import { AppNav } from "@/components/app-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Timer, DollarSign, Users, Clock, TrendingUp } from "lucide-react"

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

type Item = {
  id: string
  name: string
  category: string
  predicted_price?: number
  current_price?: number
}

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId] = useState("user123") // Replace with actual user ID from session

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [auctionsResponse, itemsResponse] = await Promise.all([
        fetch(`/api/auctions/user/${userId}`),
        fetch('/api/items')
      ])

      if (!auctionsResponse.ok || !itemsResponse.ok) {
        throw new Error("Failed to load data")
      }

      const auctionsData = await auctionsResponse.json()
      const itemsData = await itemsResponse.json()

      setAuctions(auctionsData.auctions || [])
      setItems(itemsData.items || [])
    } catch (error) {
      console.error('Error loading auction data:', error)
      setError('Failed to load auction data')
    } finally {
      setIsLoading(false)
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

  const activeAuctions = auctions.filter(a => a.status === 'active')
  const completedAuctions = auctions.filter(a => a.status === 'completed')

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
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Auctions</h1>
            <p className="text-slate-600 mt-2">Track your item auctions and bidding activity</p>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700">{error}</div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active Auctions ({activeAuctions.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedAuctions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeAuctions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-slate-500">
                    No active auctions. Create auctions from the item reporting page after confirming the price!
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeAuctions.map((auction) => {
                  const item = items.find(i => i.id === auction.item_id)
                  return (
                    <Card key={auction.id} className="border-emerald-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{item?.name || auction.item_id}</CardTitle>
                            <CardDescription>{item?.category}</CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Timer className="h-3 w-3 mr-1" />
                            {formatTimeRemaining(auction.end_time)}
                          </Badge>
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
                          <span className="text-slate-600">Started:</span>
                          <span>{new Date(auction.start_time).toLocaleDateString()}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.open(`/auctions/${auction.id}`, '_blank')}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedAuctions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-slate-500">No completed auctions yet.</div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedAuctions.map((auction) => {
                  const item = items.find(i => i.id === auction.item_id)
                  return (
                    <Card key={auction.id} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{item?.name || auction.item_id}</CardTitle>
                            <CardDescription>{item?.category}</CardDescription>
                          </div>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Starting Price:</span>
                          <span>₹{auction.starting_price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Final Price:</span>
                          <span className="font-bold text-emerald-600">
                            ₹{auction.winning_bid || 'No bids'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Ended:</span>
                          <span>{new Date(auction.end_time).toLocaleDateString()}</span>
                        </div>
                        {auction.winning_vendor_id && (
                          <div className="text-sm text-emerald-600 font-medium">
                            Won by vendor: {auction.winning_vendor_id}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
