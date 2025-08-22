export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { placeBid } from "@/lib/server/data-mongo"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { auction_id, vendor_id, bid_amount } = body

    // Validation
    if (!auction_id || !vendor_id || !bid_amount) {
      return NextResponse.json({
        error: "Missing required fields: auction_id, vendor_id, bid_amount",
        status: "error"
      }, { status: 400 })
    }

    if (bid_amount <= 0) {
      return NextResponse.json({
        error: "Bid amount must be greater than 0",
        status: "error"
      }, { status: 400 })
    }

    const result = await placeBid({
      auction_id: Number(auction_id),
      vendor_id,
      bid_amount: Number(bid_amount)
    })

    if (!result.success) {
      return NextResponse.json({
        error: result.message,
        status: "error"
      }, { status: 400 })
    }

    return NextResponse.json({
      bid: result.bid,
      message: result.message,
      status: "success"
    })

  } catch (error) {
    console.error("Error placing bid:", error)
    return NextResponse.json({
      error: "Failed to place bid",
      status: "error"
    }, { status: 500 })
  }
}
