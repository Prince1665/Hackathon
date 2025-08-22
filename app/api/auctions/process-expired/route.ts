export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { processExpiredAuctions } from "@/lib/server/data-mongo"

export async function POST(req: NextRequest) {
  try {
    await processExpiredAuctions()

    return NextResponse.json({
      message: "Expired auctions processed successfully",
      status: "success"
    })

  } catch (error) {
    console.error("Error processing expired auctions:", error)
    return NextResponse.json({
      error: "Failed to process expired auctions",
      status: "error"
    }, { status: 500 })
  }
}

// This can be called via a cron job or scheduled task
export async function GET(req: NextRequest) {
  try {
    await processExpiredAuctions()

    return NextResponse.json({
      message: "Expired auctions processed successfully",
      timestamp: new Date().toISOString(),
      status: "success"
    })

  } catch (error) {
    console.error("Error processing expired auctions:", error)
    return NextResponse.json({
      error: "Failed to process expired auctions",
      status: "error"
    }, { status: 500 })
  }
}
