export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createAuction } from "@/lib/server/data-mongo"

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 POST /api/auctions/create called")
    const body = await req.json()
    console.log("📦 Request body:", body)
    
    const { item_id, created_by, starting_price, auction_duration_hours } = body

    // Validation
    if (!item_id || !created_by || !starting_price || !auction_duration_hours) {
      console.log("❌ Validation failed - missing fields")
      return NextResponse.json({
        error: "Missing required fields: item_id, created_by, starting_price, auction_duration_hours",
        status: "error"
      }, { status: 400 })
    }

    if (starting_price <= 0) {
      console.log("❌ Validation failed - invalid starting price")
      return NextResponse.json({
        error: "Starting price must be greater than 0",
        status: "error"
      }, { status: 400 })
    }

    if (auction_duration_hours < 1 || auction_duration_hours > 168) {
      console.log("❌ Validation failed - invalid duration")
      return NextResponse.json({
        error: "Auction duration must be between 1 and 168 hours (1 week)",
        status: "error"
      }, { status: 400 })
    }

    console.log("✅ Validation passed, creating auction...")
    const auction = await createAuction({
      item_id,
      created_by,
      starting_price: Number(starting_price),
      auction_duration_hours: Number(auction_duration_hours)
    })
    
    console.log("🎉 Auction created successfully:", auction.id)
    return NextResponse.json({
      auction,
      message: "Auction created successfully",
      status: "success"
    })

  } catch (error) {
    console.error("💥 Error creating auction:", error)
    return NextResponse.json({
      error: "Failed to create auction",
      status: "error"
    }, { status: 500 })
  }
}
