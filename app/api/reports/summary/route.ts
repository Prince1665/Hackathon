export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { listItems, listDepartments, listVendors, type ItemCategory, type ItemStatus, type EwasteItem } from "@/lib/server/data-mongo"

// Sustainability helper: Get estimated weight by category (in kg)
function getItemWeight(category: ItemCategory): number {
  const weights: Record<ItemCategory, number> = {
    Laptop: 2.5,
    Smartphone: 0.2,
    Tablet: 0.5,
    TV: 25,
    Refrigerator: 70,
    "Washing Machine": 80,
    "Air Conditioner": 50,
    Microwave: 15
  }
  return weights[category] || 2
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  // Fetch all data in parallel for better performance
  const [all, departments, vendors] = await Promise.all([
    listItems(),
    listDepartments(),
    listVendors()
  ])
  
  // Pre-filter items by date range
  const inRange = all.filter((i) => {
    const d = new Date(i.reported_date).getTime()
    const okFrom = from ? d >= new Date(from).getTime() : true
    const okTo = to ? d <= new Date(to).getTime() : true
    return okFrom && okTo
  })

  // Initialize counters
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
    Tablet: 0,
    Microwave: 0,
    "Air Conditioner": 0,
    TV: 0,
    "Washing Machine": 0,
    Laptop: 0,
    Smartphone: 0,
    Refrigerator: 0,
  }
  const byDisposition: Record<string, number> = {
    Recyclable: 0,
    Reusable: 0,
    Hazardous: 0,
    'Not Specified': 0,
  }
  const byDepartment: Record<string, number> = {}
  
  // Initialize department counts
  departments.forEach(dept => {
    byDepartment[dept.name] = 0
  })

  // Single pass through items for all calculations
  let totalWeightCalc = 0
  for (const it of inRange) {
    // Status breakdown
    byStatus[it.status as ItemStatus] = (byStatus[it.status as ItemStatus] || 0) + 1
    
    // Category breakdown
    byCategory[it.category as ItemCategory] = (byCategory[it.category as ItemCategory] || 0) + 1
    
    // Disposition breakdown
    const disposition = it.disposition || 'Not Specified'
    byDisposition[disposition] = (byDisposition[disposition] || 0) + 1
    
    // Department breakdown
    const dept = departments.find(d => d.id === it.department_id)
    if (dept) {
      byDepartment[dept.name] = (byDepartment[dept.name] || 0) + 1
    }
    
    // Accumulate weight
    totalWeightCalc += getItemWeight(it.category)
  }

  // Calculate environmental impact metrics
  const totalWeight = Math.round(totalWeightCalc)
  const recycledCount = byStatus['Recycled'] || 0
  const refurbishedCount = byStatus['Refurbished'] || 0
  const safelyDisposedCount = byStatus['Safely Disposed'] || 0
  const totalProcessed = recycledCount + refurbishedCount + safelyDisposedCount
  const recoveryRate = inRange.length > 0 ? ((totalProcessed / inRange.length) * 100).toFixed(1) : '0'
  
  // Advanced sustainability calculations
  const co2SavedFromRecycling = Math.round(totalWeight * 2.1) // 2.1kg CO2 per kg e-waste recycled
  const carbonFootprintAvoidance = Math.round(totalWeight * 15 * 0.8) // 80% of manufacturing CO2 avoided
  const totalCO2Impact = co2SavedFromRecycling + carbonFootprintAvoidance
  const treesEquivalent = Math.round(totalCO2Impact / 22) // 22kg CO2 absorbed per tree annually
  const energySavedKWh = Math.round(totalWeight * 12) // 12 kWh saved per kg recycled
  const waterSavedLiters = Math.round(totalWeight * 50) // 50L water saved per kg recycled
  const landfillDiverted = totalWeight // Direct weight diverted from landfill
  
  // Material recovery estimates
  const metalsRecovered = Math.round(totalWeight * 0.3) // 30% metals
  const plasticsRecovered = Math.round(totalWeight * 0.15) // 15% plastics
  const rareearthRecovered = Math.round(totalWeight * 0.05) // 5% rare earth elements

  return NextResponse.json({ 
    from, 
    to, 
    total: inRange.length, 
    byStatus, 
    byCategory, 
    byDisposition,
    byDepartment,
    items: inRange,
    departments,
    vendors,
    environmentalImpact: {
      recoveryRate: parseFloat(recoveryRate),
      totalProcessed,
      totalWeight,
      co2SavedFromRecycling,
      carbonFootprintAvoidance,
      totalCO2Impact,
      treesEquivalent,
      energySavedKWh,
      waterSavedLiters,
      landfillDiverted,
      metalsRecovered,
      plasticsRecovered,
      rareearthRecovered,
      // Legacy fields for backward compatibility
      estimatedMetalRecovered: metalsRecovered,
      estimatedPlasticRecovered: plasticsRecovered,
      estimatedCO2Saved: totalCO2Impact / 1000, // Convert to tons
      estimatedEnergyRecovered: energySavedKWh
    }
  })
}

