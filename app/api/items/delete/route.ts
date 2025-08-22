export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/server/mongo"

export async function DELETE(req: NextRequest) {
  try {
    const { itemIds } = await req.json()

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({
        error: "Invalid request: itemIds must be a non-empty array",
        status: "error"
      }, { status: 400 })
    }

    const db = await getDb()

    // First, verify all items exist and have the correct status
    const items = await db.collection("items").find({
      _id: { $in: itemIds },
      status: { $in: ["Collected", "Safely Disposed"] }
    }).toArray()

    if (items.length !== itemIds.length) {
      return NextResponse.json({
        error: "Some items don't exist or don't have valid status for deletion (must be Collected or Safely Disposed)",
        status: "error"
      }, { status: 400 })
    }

    // Delete the items
    const deleteResult = await db.collection("items").deleteMany({
      _id: { $in: itemIds },
      status: { $in: ["Collected", "Safely Disposed"] }
    })

    // Also remove any pickup_items references
    await db.collection("pickup_items").deleteMany({
      item_id: { $in: itemIds }
    })

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} items`,
      deletedCount: deleteResult.deletedCount,
      status: "success"
    })

  } catch (error) {
    console.error("Error deleting items:", error)
    return NextResponse.json({
      error: "Failed to delete items",
      status: "error"
    }, { status: 500 })
  }
}
