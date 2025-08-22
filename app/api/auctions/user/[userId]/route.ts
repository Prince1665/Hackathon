export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getUserAuctions } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json({
        error: "User ID is required",
        status: "error"
      }, { status: 400 })
    }

    const auctions = await getUserAuctions(userId)

    return NextResponse.json({
      auctions,
      count: auctions.length,
      status: "success"
    })

  } catch (error) {
    console.error("Error fetching user auctions:", error)
    return NextResponse.json({
      error: "Failed to fetch user auctions",
      status: "error"
    }, { status: 500 })
  }
}
