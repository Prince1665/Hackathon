export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listItems } from "@/lib/server/data-mongo"

export async function GET() {
  const items = await listItems()
  
  // Group items by reported date (daily)
  const dateMap = new Map<string, number>()
  
  items.forEach(item => {
    const date = new Date(item.reported_date).toISOString().split('T')[0] // Get YYYY-MM-DD format
    dateMap.set(date, (dateMap.get(date) || 0) + 1)
  })

  // Convert to array and sort by date
  const data = Array.from(dateMap.entries())
    .map(([date, count]) => ({
      date,
      count,
      formattedDate: new Date(date).toLocaleDateString()
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return NextResponse.json(data)
}
