export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createItem, listItems, type ItemCategory, type ItemStatus } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") as ItemStatus | null
  const category = searchParams.get("category") as ItemCategory | null
  const department_id = searchParams.get("department_id")
  const rows = await listItems({
    status: status || undefined,
    category: category || undefined,
    department_id: department_id ? Number(department_id) : undefined,
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin
  const item = await createItem({
    name: body.name,
    description: body.description,
    category: body.category,
    department_id: Number(body.department_id),
    reported_by: body.reported_by,
    origin,
  })
  return NextResponse.json(item)
}
