export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listItems } from "@/lib/server/data-mongo"

export async function GET() {
  const items = await listItems()
  
  // Group items by status
  const statusCounts: Record<string, number> = {}
  items.forEach(item => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  })

  // Convert to array format for charts
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: ((count / items.length) * 100).toFixed(1)
  }))

  return NextResponse.json(data)
}
