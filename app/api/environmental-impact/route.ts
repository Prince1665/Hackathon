import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"
import { listItems } from "@/lib/server/data-mongo"
import { calculateEnvironmentalImpact, formatImpactForDisplay } from "@/lib/environmental-impact"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.user_id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - admin only" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Build filter for items
    const filter: any = {}
    if (status) filter.status = status
    if (category) filter.category = category

    // Get items from database
    const allItems = await listItems(filter)
    
    // Filter by date range if provided
    let filteredItems = allItems
    if (startDate || endDate) {
      filteredItems = allItems.filter(item => {
        const itemDate = new Date(item.created_at)
        if (startDate && itemDate < new Date(startDate)) return false
        if (endDate && itemDate > new Date(endDate)) return false
        return true
      })
    }

    // Filter for collected/disposed items only (items that have environmental impact)
    const impactItems = filteredItems.filter(item => 
      item.status?.toLowerCase().trim() === "collected" || 
      item.status?.toLowerCase().trim() === "safely disposed" ||
      item.status?.toLowerCase().trim() === "recycled" ||
      item.status?.toLowerCase().trim() === "refurbished"
    )

    // Prepare data for environmental impact calculation
    const impactData = impactItems.map(item => ({
      category: item.category,
      weight: item.weight,
      quantity: 1
    }))

    // Calculate environmental impact
    const impact = calculateEnvironmentalImpact(impactData)
    const formattedImpact = formatImpactForDisplay(impact)

    // Additional statistics
    const stats = {
      totalItems: filteredItems.length,
      impactItems: impactItems.length,
      impactPercentage: filteredItems.length > 0 ? ((impactItems.length / filteredItems.length) * 100).toFixed(1) : "0",
      categoryBreakdown: impactItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      statusBreakdown: impactItems.reduce((acc, item) => {
        const status = item.status?.toLowerCase().trim() || "unknown"
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      impact,
      formattedImpact,
      stats,
      dateRange: {
        start: startDate,
        end: endDate
      },
      filters: {
        status,
        category
      }
    })

  } catch (error) {
    console.error("Error calculating environmental impact:", error)
    return NextResponse.json({ 
      error: "Failed to calculate environmental impact" 
    }, { status: 500 })
  }
}
