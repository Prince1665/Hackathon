export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { listItems, listDepartments, listVendors } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "6months"
    const metric = searchParams.get("metric") || "overview"
    
    // Validate period parameter
    const validPeriods = ['3months', '6months', '12months', '24months']
    const selectedPeriod = validPeriods.includes(period) ? period : "6months"
    
    // Validate metric parameter
    const validMetrics = ['overview', 'trends', 'environmental', 'recovery', 'vendor']
    const selectedMetric = validMetrics.includes(metric) ? metric : "overview"
    
    const [items, departments, vendors] = await Promise.all([
      listItems(),
      listDepartments(),
      listVendors()
    ])
    
    if (!Array.isArray(items)) {
      throw new Error("Failed to fetch items data")
    }
    
    const analytics = {
      trends: generateTrends(items, selectedPeriod),
      segmentAnalysis: generateSegmentAnalysis(items, departments || []),
      recoveryRates: calculateRecoveryRates(items),
      environmentalImpact: calculateEnvironmentalImpact(items),
      vendorPerformance: analyzeVendorPerformance(items, vendors || []),
      predictions: generatePredictions(items),
      insights: generateInsights(items)
    }
    
    return NextResponse.json({
      status: "success",
      period: selectedPeriod,
      metric: selectedMetric,
      data: analytics,
      total_items: items.length,
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to generate analytics",
      status: "error"
    }, { status: 500 })
  }
}

function generateTrends(items: any[], period: string) {
  const now = new Date()
  const months = parseInt(period.replace('months', '')) || 6
  
  const trends = []
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthItems = items.filter(item => {
      const date = new Date(item.reported_date)
      return date >= monthStart && date <= monthEnd
    })
    
    const weight = monthItems.reduce((sum, item) => sum + getItemWeight(item.category), 0)
    const co2Impact = monthItems.reduce((sum, item) => sum + (getItemWeight(item.category) * 2.1), 0)
    
    trends.push({
      month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
      items: monthItems.length,
      weight_kg: Math.round(weight),
      co2_saved_kg: Math.round(co2Impact),
      recyclable: monthItems.filter(item => item.disposition === "Recyclable").length,
      reusable: monthItems.filter(item => item.disposition === "Reusable").length,
      hazardous: monthItems.filter(item => item.disposition === "Hazardous").length,
      recycled: monthItems.filter(item => item.status === "Recycled").length,
      refurbished: monthItems.filter(item => item.status === "Refurbished").length
    })
  }
  
  return {
    monthly: trends,
    growth_rate: calculateGrowthRate(trends),
    seasonal_patterns: identifySeasonalPatterns(trends)
  }
}

function generateSegmentAnalysis(items: any[], departments: any[]) {
  // Category analysis
  const byCategory: Record<string, any> = {}
  const categories = ["Laptop", "Smartphone", "Tablet", "TV", "Refrigerator", "Washing Machine", "Air Conditioner", "Microwave"]
  
  categories.forEach(category => {
    const categoryItems = items.filter(item => item.category === category)
    const weight = categoryItems.reduce((sum, item) => sum + getItemWeight(item.category), 0)
    
    byCategory[category] = {
      count: categoryItems.length,
      weight_kg: Math.round(weight),
      co2_impact: Math.round(weight * 2.1),
      avg_age: calculateAverageAge(categoryItems),
      sustainability_score: calculateSustainabilityScore(categoryItems),
      disposal_methods: {
        recyclable: categoryItems.filter(item => item.disposition === "Recyclable").length,
        reusable: categoryItems.filter(item => item.disposition === "Reusable").length,
        hazardous: categoryItems.filter(item => item.disposition === "Hazardous").length
      }
    }
  })
  
  // Department analysis
  const byDepartment: Record<string, any> = {}
  departments.forEach(dept => {
    const deptItems = items.filter(item => item.department_id === dept.id)
    const weight = deptItems.reduce((sum, item) => sum + getItemWeight(item.category), 0)
    
    byDepartment[dept.name] = {
      count: deptItems.length,
      weight_kg: Math.round(weight),
      co2_impact: Math.round(weight * 2.1),
      participation_rate: calculateParticipationRate(deptItems),
      top_categories: getTopCategories(deptItems),
      compliance_score: calculateComplianceScore(deptItems)
    }
  })
  
  return {
    by_category: byCategory,
    by_department: byDepartment,
    insights: {
      most_wasteful_category: getMostWastefulCategory(byCategory),
      most_active_department: getMostActiveDepartment(byDepartment),
      highest_impact_combination: getHighestImpactCombination(items)
    }
  }
}

function calculateRecoveryRates(items: any[]) {
  const total = items.length
  const recycled = items.filter(item => item.status === "Recycled").length
  const refurbished = items.filter(item => item.status === "Refurbished").length
  const safelyDisposed = items.filter(item => item.status === "Safely Disposed").length
  const processed = recycled + refurbished + safelyDisposed
  
  const byCategory: Record<string, any> = {}
  const categories = ["Laptop", "Smartphone", "Tablet", "TV", "Refrigerator", "Washing Machine", "Air Conditioner", "Microwave"]
  
  categories.forEach(category => {
    const categoryItems = items.filter(item => item.category === category)
    const categoryProcessed = categoryItems.filter(item => 
      ["Recycled", "Refurbished", "Safely Disposed"].includes(item.status)
    ).length
    
    byCategory[category] = {
      total: categoryItems.length,
      processed: categoryProcessed,
      rate: categoryItems.length > 0 ? Math.round((categoryProcessed / categoryItems.length) * 100) : 0,
      preferred_method: getPreferredDisposalMethod(categoryItems)
    }
  })
  
  return {
    overall: {
      total_items: total,
      processed_items: processed,
      recovery_rate: total > 0 ? Math.round((processed / total) * 100) : 0
    },
    methods: {
      recycled: { count: recycled, percentage: total > 0 ? Math.round((recycled / total) * 100) : 0 },
      refurbished: { count: refurbished, percentage: total > 0 ? Math.round((refurbished / total) * 100) : 0 },
      safely_disposed: { count: safelyDisposed, percentage: total > 0 ? Math.round((safelyDisposed / total) * 100) : 0 }
    },
    by_category: byCategory,
    efficiency_score: calculateEfficiencyScore(items)
  }
}

function calculateEnvironmentalImpact(items: any[]) {
  const totalWeight = items.reduce((sum, item) => sum + getItemWeight(item.category), 0)
  const totalCO2 = items.reduce((sum, item) => sum + (getItemWeight(item.category) * 2.1), 0)
  const materialsRecovered = {
    metals: Math.round(totalWeight * 0.3),
    plastics: Math.round(totalWeight * 0.15),
    rare_earth: Math.round(totalWeight * 0.05),
    glass: Math.round(totalWeight * 0.1)
  }
  
  // Calculate cumulative impact over time
  const monthlyImpact = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthItems = items.filter(item => {
      const date = new Date(item.reported_date)
      return date >= monthStart && date <= monthEnd
    })
    
    const monthWeight = monthItems.reduce((sum, item) => sum + getItemWeight(item.category), 0)
    const monthCO2 = monthWeight * 2.1
    
    monthlyImpact.push({
      month: monthStart.toLocaleString('default', { month: 'short' }),
      co2_saved: Math.round(monthCO2),
      weight_diverted: Math.round(monthWeight),
      cumulative_co2: Math.round(totalCO2),
      trees_equivalent: Math.round(monthCO2 / 22)
    })
  }
  
  return {
    summary: {
      total_weight_kg: Math.round(totalWeight),
      co2_prevented_kg: Math.round(totalCO2),
      trees_equivalent: Math.round(totalCO2 / 22),
      energy_saved_kwh: Math.round(totalWeight * 12),
      water_saved_liters: Math.round(totalWeight * 50),
      landfill_diverted_kg: Math.round(totalWeight)
    },
    materials_recovered: materialsRecovered,
    monthly_trends: monthlyImpact,
    projections: {
      annual_co2_savings: Math.round(totalCO2 * 12 / items.length * 30), // Rough projection
      potential_revenue: Math.round(materialsRecovered.metals * 2.5 + materialsRecovered.plastics * 0.8),
      waste_reduction_percentage: calculateWasteReductionPercentage(items)
    }
  }
}

function analyzeVendorPerformance(items: any[], vendors: any[]) {
  // This is simplified - in real implementation, you'd track vendor-item relationships
  return vendors.map(vendor => ({
    vendor_name: vendor.company_name,
    items_processed: Math.floor(Math.random() * 50), // Placeholder
    avg_processing_time: Math.floor(Math.random() * 10) + 5,
    sustainability_rating: Math.floor(Math.random() * 5) + 1,
    compliance_score: Math.floor(Math.random() * 20) + 80,
    specializations: ["Electronics", "Appliances", "Hazardous Materials"]
  }))
}

function generatePredictions(items: any[]) {
  const recentTrend = calculateRecentTrend(items, 3) // Last 3 months
  
  return {
    next_month_estimate: {
      items: Math.round(recentTrend.avgMonthlyItems * 1.1),
      weight_kg: Math.round(recentTrend.avgMonthlyWeight * 1.1),
      co2_impact: Math.round(recentTrend.avgMonthlyCO2 * 1.1)
    },
    annual_projection: {
      items: Math.round(recentTrend.avgMonthlyItems * 12),
      weight_kg: Math.round(recentTrend.avgMonthlyWeight * 12),
      co2_impact: Math.round(recentTrend.avgMonthlyCO2 * 12),
      cost_savings: Math.round(recentTrend.avgMonthlyWeight * 12 * 5) // $5 per kg saved
    },
    peak_periods: identifyPeakPeriods(items),
    capacity_requirements: calculateCapacityRequirements(items)
  }
}

function generateInsights(items: any[]) {
  const insights = []
  
  // Trend insights
  const trend = calculateRecentTrend(items, 3)
  if (trend.growth > 20) {
    insights.push({
      type: "trend",
      priority: "high",
      title: "📈 Significant Growth Detected",
      message: `E-waste reporting has increased by ${trend.growth}% over the last 3 months`,
      action: "Consider scaling up collection capacity and vendor partnerships"
    })
  }
  
  // Sustainability insights
  const reusableRate = (items.filter(item => item.disposition === "Reusable").length / items.length) * 100
  if (reusableRate > 15) {
    insights.push({
      type: "sustainability",
      priority: "medium",
      title: "🔄 High Reuse Potential",
      message: `${reusableRate.toFixed(1)}% of items are suitable for reuse`,
      action: "Implement internal redistribution or donation programs"
    })
  }
  
  // Compliance insights
  const hazardousItems = items.filter(item => item.disposition === "Hazardous")
  if (hazardousItems.length > 10) {
    insights.push({
      type: "compliance",
      priority: "high",
      title: "⚠️ Hazardous Material Alert",
      message: `${hazardousItems.length} hazardous items require special handling`,
      action: "Ensure certified hazardous waste vendor partnerships are active"
    })
  }
  
  return insights
}

// Helper functions
function getItemWeight(category: string): number {
  const weights: Record<string, number> = {
    "Laptop": 2.5,
    "Smartphone": 0.2,
    "Tablet": 0.5,
    "TV": 25,
    "Refrigerator": 70,
    "Washing Machine": 80,
    "Air Conditioner": 50,
    "Microwave": 15
  }
  return weights[category] || 2
}

function calculateGrowthRate(trends: any[]): number {
  if (trends.length < 2) return 0
  const recent = trends[trends.length - 1].items
  const previous = trends[trends.length - 2].items
  return previous > 0 ? Math.round(((recent - previous) / previous) * 100) : 0
}

function identifySeasonalPatterns(trends: any[]) {
  // Simple pattern detection - in real app, use more sophisticated analysis
  const monthlyAvg = trends.reduce((sum, t) => sum + t.items, 0) / trends.length
  return trends.map(t => ({
    month: t.month,
    above_average: t.items > monthlyAvg,
    deviation: Math.round(((t.items - monthlyAvg) / monthlyAvg) * 100)
  }))
}

function calculateAverageAge(items: any[]): number {
  const ages = items.map(item => item.used_duration || 2)
  return ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 2
}

function calculateSustainabilityScore(items: any[]): number {
  let score = 0
  items.forEach(item => {
    if (item.disposition === "Reusable") score += 40
    else if (item.disposition === "Recyclable") score += 25
    else if (item.disposition === "Hazardous") score += 15
    
    if (item.status === "Refurbished") score += 20
    else if (item.status === "Recycled") score += 15
  })
  return items.length > 0 ? Math.round(score / items.length) : 0
}

function calculateRecentTrend(items: any[], months: number) {
  const now = new Date()
  let totalItems = 0, totalWeight = 0, totalCO2 = 0
  
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthItems = items.filter(item => {
      const date = new Date(item.reported_date)
      return date >= monthStart && date <= monthEnd
    })
    
    totalItems += monthItems.length
    const weight = monthItems.reduce((sum, item) => sum + getItemWeight(item.category), 0)
    totalWeight += weight
    totalCO2 += weight * 2.1
  }
  
  return {
    avgMonthlyItems: Math.round(totalItems / months),
    avgMonthlyWeight: Math.round(totalWeight / months),
    avgMonthlyCO2: Math.round(totalCO2 / months),
    growth: calculateGrowthRate(items as any[])
  }
}

// Additional helper functions with placeholder implementations
function calculateParticipationRate(items: any[]): number {
  return Math.floor(Math.random() * 30) + 70 // 70-100%
}

function getTopCategories(items: any[]): string[] {
  const categories: Record<string, number> = {}
  items.forEach(item => {
    categories[item.category] = (categories[item.category] || 0) + 1
  })
  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category)
}

function calculateComplianceScore(items: any[]): number {
  return Math.floor(Math.random() * 20) + 80 // 80-100%
}

function getMostWastefulCategory(byCategory: Record<string, any>): string {
  return Object.entries(byCategory).sort(([,a], [,b]) => b.co2_impact - a.co2_impact)[0]?.[0] || "Unknown"
}

function getMostActiveDepartment(byDepartment: Record<string, any>): string {
  return Object.entries(byDepartment).sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || "Unknown"
}

function getHighestImpactCombination(items: any[]): { category: string; department: string; impact: number } {
  // Simplified implementation
  return { category: "TV", department: "Engineering", impact: 500 }
}

function getPreferredDisposalMethod(items: any[]): string {
  const methods: Record<string, number> = {}
  items.forEach(item => {
    if (["Recycled", "Refurbished", "Safely Disposed"].includes(item.status)) {
      methods[item.status] = (methods[item.status] || 0) + 1
    }
  })
  return Object.entries(methods).sort(([,a], [,b]) => b - a)[0]?.[0] || "Recycled"
}

function calculateEfficiencyScore(items: any[]): number {
  const processed = items.filter(item => 
    ["Recycled", "Refurbished", "Safely Disposed"].includes(item.status)
  ).length
  const total = items.length
  return total > 0 ? Math.round((processed / total) * 100) : 0
}

function calculateWasteReductionPercentage(items: any[]): number {
  return Math.floor(Math.random() * 20) + 75 // 75-95%
}

function identifyPeakPeriods(items: any[]): string[] {
  return ["End of Academic Year", "Post-Holiday Season", "Semester Transitions"]
}

function calculateCapacityRequirements(items: any[]): { storage: string; transport: string; processing: string } {
  return {
    storage: "Medium - Consider additional collection points",
    transport: "Current capacity sufficient",
    processing: "Scale up recycling partnerships"
  }
}
