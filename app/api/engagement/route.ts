export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { listItems, listDepartments } from "@/lib/server/data-mongo"

// User Engagement & Sustainability Challenges API
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month" // week, month, quarter, year
    
    // Validate period parameter
    const validPeriods = ["week", "month", "quarter", "year"]
    const selectedPeriod = validPeriods.includes(period) ? period : "month"
    
    const [items, departments] = await Promise.all([
      listItems(),
      listDepartments()
    ])
    
    if (!Array.isArray(items)) {
      throw new Error("Failed to fetch items data")
    }

    if (!Array.isArray(departments)) {
      throw new Error("Failed to fetch departments data")
    }
    
    const challenges = generateActiveChallenges(items, selectedPeriod)
    const leaderboards = generateLeaderboards(items, departments, selectedPeriod)
    const achievements = generateAchievements(items)
    const impactMetrics = calculateCommunityImpact(items)
    
    return NextResponse.json({
      status: "success",
      period: selectedPeriod,
      challenges,
      leaderboards,
      achievements,
      impactMetrics,
      engagement: {
        totalParticipants: getTotalParticipants(items),
        activeThisMonth: getActiveParticipants(items, 30),
        completionRate: getCompletionRate(items)
      },
      generated_at: new Date().toISOString(),
      data_points: items.length
    })
  } catch (error) {
    console.error("Engagement API error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch engagement data",
      status: "error"
    }, { status: 500 })
  }
}

function generateActiveChallenges(items: any[], period: string) {
  const now = new Date()
  const periodStart = getPeriodStart(now, period)
  
  const periodItems = items.filter(item => 
    new Date(item.reported_date) >= periodStart
  )
  
  return {
    "green_warrior": {
      id: "green_warrior",
      title: "🌱 Green Warrior Challenge",
      description: "Report 5+ e-waste items this month and earn Green Warrior status",
      target: 5,
      period: "month",
      reward: "Green Warrior Badge + Department Recognition",
      progress: Math.min(periodItems.length, 5),
      completed: periodItems.length >= 5,
      category: "individual",
      sustainability_impact: "Prevents 25kg+ CO₂ emissions"
    },
    "department_champion": {
      id: "department_champion",
      title: "🏆 Department Champion",
      description: "Your department reports the most e-waste items this quarter",
      target: "ranking",
      period: "quarter",
      reward: "Champion Trophy + Sustainability Fund",
      category: "department",
      sustainability_impact: "Drives campus-wide awareness"
    },
    "recycling_streak": {
      id: "recycling_streak",
      title: "♻️ Recycling Streak",
      description: "Report e-waste for 7 consecutive weeks",
      target: 7,
      period: "week",
      reward: "Sustainability Certificate",
      category: "individual",
      sustainability_impact: "Builds long-term sustainable habits"
    },
    "hazard_hero": {
      id: "hazard_hero",
      title: "⚠️ Hazard Hero",
      description: "Correctly identify and report 3+ hazardous e-waste items",
      target: 3,
      period: "month",
      reward: "Safety Champion Badge",
      progress: periodItems.filter(item => item.disposition === "Hazardous").length,
      completed: periodItems.filter(item => item.disposition === "Hazardous").length >= 3,
      category: "safety",
      sustainability_impact: "Prevents environmental contamination"
    },
    "reuse_advocate": {
      id: "reuse_advocate",
      title: "🔄 Reuse Advocate",
      description: "Report 10+ items suitable for reuse/refurbishment",
      target: 10,
      period: "month",
      reward: "Circular Economy Champion Badge",
      progress: periodItems.filter(item => item.disposition === "Reusable").length,
      completed: periodItems.filter(item => item.disposition === "Reusable").length >= 10,
      category: "circular_economy",
      sustainability_impact: "Extends product lifecycle significantly"
    }
  }
}

function generateLeaderboards(items: any[], departments: any[], period: string) {
  const now = new Date()
  const periodStart = getPeriodStart(now, period)
  
  const periodItems = items.filter(item => 
    new Date(item.reported_date) >= periodStart
  )
  
  // Individual leaderboard
  const individualStats: Record<string, { name: string; count: number; co2_saved: number }> = {}
  
  periodItems.forEach(item => {
    const reporter = item.reported_by || "Anonymous"
    if (!individualStats[reporter]) {
      individualStats[reporter] = { name: reporter, count: 0, co2_saved: 0 }
    }
    individualStats[reporter].count++
    individualStats[reporter].co2_saved += getItemCO2Impact(item.category)
  })
  
  // Department leaderboard
  const deptStats: Record<string, { name: string; count: number; co2_saved: number; participants: Set<string> }> = {}
  
  departments.forEach(dept => {
    deptStats[dept.id] = { 
      name: dept.name, 
      count: 0, 
      co2_saved: 0,
      participants: new Set()
    }
  })
  
  periodItems.forEach(item => {
    const deptId = item.department_id
    if (deptStats[deptId]) {
      deptStats[deptId].count++
      deptStats[deptId].co2_saved += getItemCO2Impact(item.category)
      deptStats[deptId].participants.add(item.reported_by || "Anonymous")
    }
  })
  
  return {
    individual: Object.values(individualStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name,
        items_reported: user.count,
        co2_saved_kg: Math.round(user.co2_saved),
        badge: getRankBadge(index + 1)
      })),
      
    department: Object.values(deptStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((dept, index) => ({
        rank: index + 1,
        name: dept.name,
        items_reported: dept.count,
        co2_saved_kg: Math.round(dept.co2_saved),
        participants: dept.participants.size,
        badge: getDeptBadge(index + 1)
      }))
  }
}

function generateAchievements(items: any[]) {
  const totalItems = items.length
  const hazardousItems = items.filter(item => item.disposition === "Hazardous").length
  const reusableItems = items.filter(item => item.disposition === "Reusable").length
  const recycledItems = items.filter(item => item.status === "Recycled").length
  
  const achievements = []
  
  // Milestone achievements
  if (totalItems >= 100) achievements.push({
    id: "century_club",
    title: "💯 Century Club",
    description: "Campus has reported 100+ e-waste items",
    unlocked: true,
    impact: "Major environmental milestone reached"
  })
  
  if (hazardousItems >= 50) achievements.push({
    id: "hazard_master",
    title: "⚠️ Hazard Master",
    description: "50+ hazardous items properly identified",
    unlocked: true,
    impact: "Prevented significant environmental contamination"
  })
  
  if (reusableItems >= 25) achievements.push({
    id: "reuse_pioneer",
    title: "🔄 Reuse Pioneer",
    description: "25+ items marked for reuse/refurbishment",
    unlocked: true,
    impact: "Extended lifecycle of valuable electronics"
  })
  
  const totalCO2 = items.reduce((sum, item) => sum + getItemCO2Impact(item.category), 0)
  if (totalCO2 >= 1000) achievements.push({
    id: "carbon_crusader",
    title: "🌍 Carbon Crusader",
    description: "Prevented 1000+ kg CO₂ emissions",
    unlocked: true,
    impact: "Equivalent to planting 45+ trees"
  })
  
  return achievements
}

function calculateCommunityImpact(items: any[]) {
  const totalWeight = items.reduce((sum, item) => sum + getItemWeight(item.category), 0)
  const totalCO2 = items.reduce((sum, item) => sum + getItemCO2Impact(item.category), 0)
  const hazardousPrevented = items.filter(item => item.disposition === "Hazardous").length
  const itemsRefurbished = items.filter(item => item.status === "Refurbished").length
  
  return {
    total_items: items.length,
    total_weight_kg: Math.round(totalWeight),
    co2_prevented_kg: Math.round(totalCO2),
    trees_equivalent: Math.round(totalCO2 / 22),
    hazardous_prevented: hazardousPrevented,
    items_given_new_life: itemsRefurbished,
    energy_saved_kwh: Math.round(totalWeight * 12),
    landfill_diverted_kg: Math.round(totalWeight),
    community_participation_rate: getTotalParticipants(items) > 0 ? 
      Math.round((getTotalParticipants(items) / 1000) * 100) + "%" : "0%"
  }
}

function getTotalParticipants(items: any[]) {
  const participants = new Set(items.map(item => item.reported_by).filter(Boolean))
  return participants.size
}

function getActiveParticipants(items: any[], days: number) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  const recentItems = items.filter(item => new Date(item.reported_date) >= cutoff)
  const participants = new Set(recentItems.map(item => item.reported_by).filter(Boolean))
  return participants.size
}

function getCompletionRate(items: any[]) {
  const completedStates = ["Recycled", "Refurbished", "Safely Disposed"]
  const completed = items.filter(item => completedStates.includes(item.status)).length
  return items.length > 0 ? Math.round((completed / items.length) * 100) : 0
}

function getPeriodStart(now: Date, period: string): Date {
  const start = new Date(now)
  switch (period) {
    case "week":
      start.setDate(start.getDate() - 7)
      break
    case "month":
      start.setMonth(start.getMonth() - 1)
      break
    case "quarter":
      start.setMonth(start.getMonth() - 3)
      break
    case "year":
      start.setFullYear(start.getFullYear() - 1)
      break
  }
  return start
}

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

function getItemCO2Impact(category: string): number {
  return getItemWeight(category) * 2.1
}

function getRankBadge(rank: number): string {
  switch (rank) {
    case 1: return "🥇 Sustainability Champion"
    case 2: return "🥈 Green Guardian"
    case 3: return "🥉 Eco Warrior"
    default: return "🌱 Earth Protector"
  }
}

function getDeptBadge(rank: number): string {
  switch (rank) {
    case 1: return "🏆 Department Champion"
    case 2: return "⭐ Green Leaders"
    case 3: return "🌟 Eco Advocates"
    default: return "🌱 Green Team"
  }
}
