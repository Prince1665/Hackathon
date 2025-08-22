export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createItem, listItems, type ItemCategory, type ItemStatus, type Disposition } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Extract and validate query parameters
    const status = searchParams.get("status") as ItemStatus | null
    const category = searchParams.get("category") as ItemCategory | null
    const department_id = searchParams.get("department_id")
    const disposition = searchParams.get("disposition") as Disposition | null
    
    // Validate department_id if provided
    let validDepartmentId: number | undefined
    if (department_id) {
      const parsed = parseInt(department_id, 10)
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json({
          error: "Invalid department_id: must be a non-negative integer",
          status: "error"
        }, { status: 400 })
      }
      validDepartmentId = parsed
    }

    const filter = {
      status: status || undefined,
      category: category || undefined,
      department_id: validDepartmentId,
      disposition: (disposition as any) || undefined,
    }

    const rows = await listItems(filter)
    
    if (!Array.isArray(rows)) {
      throw new Error("Failed to retrieve items")
    }

    return NextResponse.json({
      items: rows,
      count: rows.length,
      filters_applied: filter,
      status: "success"
    })
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch items",
      status: "error"
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({
        error: "Name is required and must be a non-empty string",
        status: "error"
      }, { status: 400 })
    }

    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json({
        error: "Category is required and must be a string",
        status: "error"
      }, { status: 400 })
    }

    if (!body.department_id || isNaN(Number(body.department_id))) {
      return NextResponse.json({
        error: "Department ID is required and must be a number",
        status: "error"
      }, { status: 400 })
    }

    if (!body.reported_by || typeof body.reported_by !== 'string') {
      return NextResponse.json({
        error: "Reported by is required and must be a string",
        status: "error"
      }, { status: 400 })
    }

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

    const itemData = {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
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
      price_source: body.price_source || "ml_predicted", // Track price source
      predicted_price: validatePositiveNumber(body.predicted_price), // Store ML predicted price
    }

    const item = await createItem(itemData)
    
    if (!item) {
      throw new Error("Failed to create item")
    }

    return NextResponse.json({
      item,
      status: "success",
      message: "Item created successfully"
    })
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to create item",
      status: "error"
    }, { status: 500 })
  }
}
