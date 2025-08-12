import { NextResponse } from "next/server"
import { analyticsCategoryDistribution } from "@/lib/server/data-mongo"

export async function GET() {
  const data = await analyticsCategoryDistribution()
  return NextResponse.json(data)
}
