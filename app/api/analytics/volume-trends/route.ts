export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { analyticsVolumeTrends } from "@/lib/server/data-mongo"

export async function GET() {
  const data = await analyticsVolumeTrends()
  return NextResponse.json(data)
}
