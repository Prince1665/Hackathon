export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { listItems, type ItemCategory, type ItemStatus } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const all = await listItems()
  const inRange = all.filter((i) => {
    const d = new Date(i.reported_date).getTime()
    const okFrom = from ? d >= new Date(from).getTime() : true
    const okTo = to ? d <= new Date(to).getTime() : true
    return okFrom && okTo
  })

  const byStatus: Record<ItemStatus, number> = {
    Reported: 0,
    "Awaiting Pickup": 0,
    Scheduled: 0,
    Collected: 0,
    Recycled: 0,
    Refurbished: 0,
    "Safely Disposed": 0,
  }
  const byCategory: Record<ItemCategory, number> = {
    Laptop: 0,
    Monitor: 0,
    Battery: 0,
    Other: 0,
  }
  for (const it of inRange) {
    // @ts-ignore
    byStatus[it.status as ItemStatus] = (byStatus[it.status as ItemStatus] || 0) + 1
    // @ts-ignore
    byCategory[it.category as ItemCategory] = (byCategory[it.category as ItemCategory] || 0) + 1
  }

  return NextResponse.json({ from, to, total: inRange.length, byStatus, byCategory })
}

