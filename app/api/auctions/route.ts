import { NextRequest, NextResponse } from "next/server"
import { createAuction, listAuctions, checkExpiredAuctions } from "@/lib/server/data-mongo"
import { getSession } from "@/lib/server/auth"

// Cache for last expired auction check to avoid checking too frequently
let lastExpiredCheck = 0
const EXPIRED_CHECK_INTERVAL = 60000 // 1 minute

export async function GET(request: NextRequest) {
  try {
    // Check for expired auctions only once per minute to avoid race conditions
    const now = Date.now()
    if (now - lastExpiredCheck > EXPIRED_CHECK_INTERVAL) {
      console.log("🕐 Checking for expired auctions...")
      await checkExpiredAuctions()
      lastExpiredCheck = now
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "active" | "completed" | "cancelled" | null
    const created_by = searchParams.get("created_by")
    const item_id = searchParams.get("item_id")

    const filter: any = {}
    if (status) filter.status = status
    if (created_by) filter.created_by = created_by
    if (item_id) filter.item_id = item_id

    const auctions = await listAuctions(filter)
    return NextResponse.json(auctions)
  } catch (error) {
    console.error("Error fetching auctions:", error)
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { item_id, starting_price, duration_hours } = body
    
    if (!item_id || !starting_price || !duration_hours) {
      return NextResponse.json({ 
        error: "Missing required fields: item_id, starting_price, duration_hours" 
      }, { status: 400 })
    }
    
    if (starting_price < 0 || duration_hours <= 0) {
      return NextResponse.json({ 
        error: "Invalid values: starting_price must be >= 0, duration_hours must be > 0" 
      }, { status: 400 })
    }
    
    const auction = await createAuction({
      item_id,
      created_by: session.user.user_id,
      starting_price: Number(starting_price),
      duration_hours: Number(duration_hours)
    })
    
    return NextResponse.json(auction, { status: 201 })
  } catch (error) {
    console.error("Error creating auction:", error)
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 })
  }
}
