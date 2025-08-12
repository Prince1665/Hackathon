import { NextResponse } from "next/server"
import { analyticsRecoveryRate } from "@/lib/server/data-mongo"

export async function GET() {
  const data = await analyticsRecoveryRate()
  return NextResponse.json(data)
}
