import { NextRequest, NextResponse } from "next/server"
import { placeBid, listBids } from "@/lib/server/data-mongo"
import { getSession } from "@/lib/server/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auction_id = params.id
    const { searchParams } = new URL(request.url)
    const includeVendor = searchParams.get("include_vendor") === "true"

    if (includeVendor) {
      const { listBidsWithVendorInfo } = await import("@/lib/server/data-mongo")
      const bids = await listBidsWithVendorInfo(auction_id)
      return NextResponse.json(bids)
    } else {
      const bids = await listBids(auction_id)
      return NextResponse.json(bids)
    }
  } catch (error) {
    console.error("Error fetching bids:", error)
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user?.user_id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized - vendors only" }, { status: 401 })
    }

    // Resolve the vendor_id associated with this logged-in vendor user
    const { getDb } = await import("@/lib/server/mongo")
    const { ObjectId } = await import("mongodb")
    const db = await getDb()

    let vendorId = ""
    let vendorInfo = null

    try {
      const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.user_id) })
      const email = (user as any)?.email || ""
      if (email) {
        const vendor = await db.collection("vendors").findOne({ email })
        if (vendor?._id) {
          vendorId = String(vendor._id)
          vendorInfo = {
            id: vendorId,
            company_name: vendor.company_name,
            contact_person: vendor.contact_person,
            email: vendor.email
          }
        }
      }
    } catch (error) {
      console.error("Error resolving vendor:", error)
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor profile not found. Please contact support." }, { status: 404 })
    }

    const auction_id = params.id
    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({
        error: "Invalid amount - must be greater than 0"
      }, { status: 400 })
    }

    console.log(`🎯 Vendor ${vendorInfo?.company_name} (${vendorInfo?.contact_person}) attempting to bid ₹${amount} on auction ${auction_id}`)

    const bid = await placeBid({
      auction_id,
      vendor_id: vendorId,
      amount: Number(amount)
    })

    console.log(`✅ Bid placed successfully by ${vendorInfo?.company_name}:`, bid)
    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    console.error("❌ Error placing bid:", error)
    const message = error instanceof Error ? error.message : "Failed to place bid"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
