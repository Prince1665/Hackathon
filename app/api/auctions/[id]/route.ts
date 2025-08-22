export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getAuctionById, getAuctionBids } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const auctionId = Number(id)

    if (isNaN(auctionId)) {
      return NextResponse.json({
        error: "Invalid auction ID",
        status: "error"
      }, { status: 400 })
    }

    const [auction, bids] = await Promise.all([
      getAuctionById(auctionId),
      getAuctionBids(auctionId)
    ])

    if (!auction) {
      return NextResponse.json({
        error: "Auction not found",
        status: "error"
      }, { status: 404 })
    }

    return NextResponse.json({
      auction,
      bids,
      totalBids: bids.length,
      status: "success"
    })

  } catch (error) {
    console.error("Error fetching auction details:", error)
    return NextResponse.json({
      error: "Failed to fetch auction details",
      status: "error"
    }, { status: 500 })
  }
}
