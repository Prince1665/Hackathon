export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listItems } from "@/lib/server/data-mongo"

export async function GET() {
  const items = await listItems()
  
  // Group items by disposition
  const dispositionCounts: Record<string, number> = {}
  items.forEach(item => {
    const disposition = item.disposition || 'Not Specified'
    dispositionCounts[disposition] = (dispositionCounts[disposition] || 0) + 1
  })

  // Convert to array format for charts
  const data = Object.entries(dispositionCounts).map(([disposition, count]) => ({
    disposition,
    count,
    percentage: ((count / items.length) * 100).toFixed(1)
  }))

  return NextResponse.json(data)
}
