export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createItem, listItems, type ItemCategory, type ItemStatus, type Disposition } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") as ItemStatus | null
  const category = searchParams.get("category") as ItemCategory | null
  const department_id = searchParams.get("department_id")
  const disposition = searchParams.get("disposition") as Disposition | null
  const rows = await listItems({
    status: status || undefined,
    category: category || undefined,
    department_id: department_id ? Number(department_id) : undefined,
    disposition: (disposition as any) || undefined,
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const origin = req.headers.get("x-forwarded-host")
    ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
    : new URL(req.url).origin
  
  // Validate numeric fields to ensure they're not negative
  const validatePositiveNumber = (value: any) => {
    if (value === undefined || value === null || value === "") return undefined
    const num = Number(value)
    return isNaN(num) || num < 0 ? undefined : num
  }

  // Validate string fields to ensure they're not empty strings
  const validateString = (value: any) => {
    if (value === undefined || value === null || value === "") return undefined
    return String(value).trim() || undefined
  }

  // Validate usage pattern
  const validateUsagePattern = (value: any): "Light" | "Moderate" | "Heavy" | undefined => {
    if (value === undefined || value === null || value === "") return undefined
    const validPatterns = ["Light", "Moderate", "Heavy"]
    return validPatterns.includes(value) ? value : undefined
  }

  const item = await createItem({
    name: body.name,
    description: body.description,
    category: body.category,
    department_id: Number(body.department_id),
    reported_by: body.reported_by,
    origin,
    disposition: body.disposition || undefined,
    brand: validateString(body.brand),
    build_quality: validatePositiveNumber(body.build_quality),
    user_lifespan: validatePositiveNumber(body.user_lifespan),
    usage_pattern: validateUsagePattern(body.usage_pattern),
    expiry_years: validatePositiveNumber(body.expiry_years),
    condition: validatePositiveNumber(body.condition),
    original_price: validatePositiveNumber(body.original_price),
    used_duration: validatePositiveNumber(body.used_duration),
    current_price: validatePositiveNumber(body.current_price) || 0, // Use provided current_price or default to 0
  })
  return NextResponse.json(item)
}
