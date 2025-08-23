import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"
import { getDb } from "@/lib/server/mongo"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.user_id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized - vendors only" }, { status: 401 })
    }

    // Resolve the vendor_id associated with this logged-in vendor user
    const db = await getDb()
    let vendorId = ""
    
    try {
      const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.user_id) })
      const email = (user as any)?.email || ""
      if (email) {
        const vendor = await db.collection("vendors").findOne({ email })
        if (vendor?._id) {
          vendorId = String(vendor._id)
        }
      }
    } catch (error) {
      console.error("Error resolving vendor:", error)
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 })
    }

    // Fetch all bids for this vendor
    const bids = await db.collection("bids").find({ 
      vendor_id: vendorId 
    }).sort({ bid_time: -1 }).toArray()

    const formattedBids = bids.map(bid => ({
      id: String(bid._id),
      auction_id: bid.auction_id,
      vendor_id: bid.vendor_id,
      amount: bid.amount,
      bid_time: bid.bid_time,
      status: bid.status
    }))

    return NextResponse.json(formattedBids)
  } catch (error) {
    console.error("Error fetching vendor bids:", error)
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 })
  }
}
