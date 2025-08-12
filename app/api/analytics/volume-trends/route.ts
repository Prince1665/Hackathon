import { NextResponse } from "next/server"
import { analyticsVolumeTrends } from "@/lib/server/db"

export async function GET() {
  const data = await analyticsVolumeTrends()
  return NextResponse.json(data)
}
