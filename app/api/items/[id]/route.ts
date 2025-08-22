export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getItem, updateItem } from "@/lib/server/data-mongo"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }
    
    const item = await getItem(params.id)
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    return NextResponse.json(item)
  } catch (error) {
    console.error("Error fetching item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }
    
    const changes = await req.json()
    
    // Validate changes object
    if (!changes || typeof changes !== 'object') {
      return NextResponse.json({ error: "Invalid update data" }, { status: 400 })
    }

    // Validate allowed fields for update
    const allowedFields = ['status', 'description', 'category', 'disposed_date', 'disposition']
    const validChanges = Object.keys(changes).filter(key => allowedFields.includes(key))
    
    if (validChanges.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const filteredChanges = Object.fromEntries(
      validChanges.map(key => [key, changes[key]])
    )

    const updated = await updateItem(params.id, filteredChanges)
    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
