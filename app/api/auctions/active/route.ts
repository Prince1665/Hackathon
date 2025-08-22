export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getActiveAuctions } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  try {
    const auctions = await getActiveAuctions()

    return NextResponse.json({
      auctions,
      count: auctions.length,
      status: "success"
    })

  } catch (error) {
    console.error("Error fetching active auctions:", error)
    return NextResponse.json({
      error: "Failed to fetch active auctions",
      status: "error"
    }, { status: 500 })
  }
}
