import { NextRequest, NextResponse } from "next/server"
import { createItem, listItems } from "@/lib/server/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined
  const department_id = searchParams.get("department_id") || undefined
  const category = searchParams.get("category") || undefined
  const items = await listItems({
    status: status as any,
    department_id: department_id ? Number(department_id) : undefined,
    category: category as any,
  })
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } })
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
  return NextResponse.json(item, { headers: { "Cache-Control": "no-store" } })
}
