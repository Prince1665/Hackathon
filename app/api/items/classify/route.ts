export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"

// Smart Classification API for E-Waste Items
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, condition, age, brand } = body
    
    // Validate input
    if (!category || typeof category !== 'string') {
      return NextResponse.json({
        error: "Category is required and must be a string",
        status: "error"
      }, { status: 400 })
    }

    // Validate optional numeric fields
    if (condition !== undefined && (typeof condition !== 'number' || condition < 1 || condition > 5)) {
      return NextResponse.json({
        error: "Condition must be a number between 1 and 5",
        status: "error"
      }, { status: 400 })
    }

    if (age !== undefined && (typeof age !== 'number' || age < 0)) {
      return NextResponse.json({
        error: "Age must be a non-negative number",
        status: "error"
      }, { status: 400 })
    }

    const classification = classifyEWasteItem({ category, condition, age, brand })
    
    if (!classification) {
      return NextResponse.json({
        error: "Failed to classify item",
        status: "error"
      }, { status: 500 })
    }

    return NextResponse.json({
      status: "success",
      classification,
      recommendations: getRecommendations(classification)
    })
  } catch (error) {
    console.error("Classification error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to classify item",
      status: "error"
    }, { status: 500 })
  }
}

function classifyEWasteItem(item: { category: string; condition?: number; age?: number; brand?: string }) {
  const { category, condition = 3, age = 2, brand } = item
  
  // Primary disposition based on condition and age
  let disposition: "Recyclable" | "Reusable" | "Hazardous" = "Recyclable"
  let priority: "High" | "Medium" | "Low" = "Medium"
  let sustainabilityScore = 0
  
  // Reusability assessment
  if (condition >= 4 && age <= 3) {
    disposition = "Reusable"
    sustainabilityScore += 40 // Reuse has highest sustainability impact
  } else if (condition >= 3 && age <= 5) {
    disposition = "Recyclable"
    sustainabilityScore += 25
  } else {
    disposition = "Recyclable"
    sustainabilityScore += 15
  }
  
  // Hazardous material check
  const hazardousCategories = ["Refrigerator", "Air Conditioner", "TV", "Microwave"]
  if (hazardousCategories.includes(category)) {
    if (disposition !== "Reusable") {
      disposition = "Hazardous"
    }
    priority = "High"
    sustainabilityScore -= 10 // Requires special handling
  }
  
  // Category-specific sustainability factors
  const categoryImpact: Record<string, number> = {
    "Smartphone": 15, // High rare earth content
    "Laptop": 20,     // Complex components
    "TV": 25,         // Heavy metals
    "Refrigerator": 35, // Refrigerants
    "Air Conditioner": 35,
    "Washing Machine": 15,
    "Microwave": 10,
    "Tablet": 12
  }
  
  sustainabilityScore += categoryImpact[category] || 10
  
  // Brand reliability factor (premium brands last longer, better for reuse)
  const premiumBrands = ["Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Microsoft"]
  if (brand && premiumBrands.includes(brand)) {
    sustainabilityScore += 5
    if (condition >= 3 && disposition === "Recyclable") {
      disposition = "Reusable" // Upgrade to reusable for premium brands in good condition
    }
  }
  
  return {
    disposition,
    priority,
    sustainabilityScore: Math.min(100, sustainabilityScore),
    environmentalImpact: calculateEnvironmentalImpact(category, disposition),
    handlingInstructions: getHandlingInstructions(category, disposition)
  }
}

function calculateEnvironmentalImpact(category: string, disposition: string) {
  const baseWeights: Record<string, number> = {
    "Laptop": 2.5,
    "Smartphone": 0.2,
    "Tablet": 0.5,
    "TV": 25,
    "Refrigerator": 70,
    "Washing Machine": 80,
    "Air Conditioner": 50,
    "Microwave": 15
  }
  
  const weight = baseWeights[category] || 2
  const co2Factor = disposition === "Reusable" ? 0.9 : disposition === "Recyclable" ? 0.7 : 0.4
  
  return {
    weight_kg: weight,
    co2_saved_kg: Math.round(weight * 2.1 * co2Factor),
    energy_recovered_kwh: Math.round(weight * 12 * co2Factor),
    materials_recovered: {
      metals_kg: Math.round(weight * 0.3 * (disposition === "Recyclable" ? 1 : 0.1)),
      plastics_kg: Math.round(weight * 0.15 * (disposition === "Recyclable" ? 1 : 0.1)),
      rare_earth_kg: Math.round(weight * 0.05 * (disposition === "Recyclable" ? 1 : 0))
    }
  }
}

function getHandlingInstructions(category: string, disposition: string) {
  const instructions: Record<string, Record<string, string>> = {
    "Recyclable": {
      "Smartphone": "Remove battery and SIM card. Data wipe required. Send to certified e-waste recycler.",
      "Laptop": "Remove hard drive and battery. Data destruction required. Separate screen from body.",
      "TV": "Handle with care - contains lead and mercury. Requires specialized recycling facility.",
      "Refrigerator": "HAZARDOUS: Refrigerant removal by certified technician required before recycling.",
      "Air Conditioner": "HAZARDOUS: Refrigerant and oil removal required. Special disposal needed.",
      "Washing Machine": "Drain all fluids. Remove electronic components separately.",
      "Microwave": "Remove magnetron carefully. Handle transformer with caution.",
      "Tablet": "Remove battery if possible. Data wipe required."
    },
    "Reusable": {
      "default": "Clean thoroughly. Test all functions. Create refurbishment checklist. Update firmware if applicable."
    },
    "Hazardous": {
      "default": "Store in designated hazardous area. Schedule priority pickup with certified hazardous waste vendor."
    }
  }
  
  return instructions[disposition]?.[category] || instructions[disposition]?.["default"] || "Follow standard e-waste procedures."
}

function getRecommendations(classification: any) {
  const recommendations = []
  
  if (classification.disposition === "Reusable") {
    recommendations.push("💡 Consider internal redistribution or donation programs")
    recommendations.push("🔧 Schedule refurbishment assessment")
    recommendations.push("📈 High sustainability impact - extends product lifecycle")
  }
  
  if (classification.priority === "High") {
    recommendations.push("⚠️ Priority handling required - schedule immediate pickup")
  }
  
  if (classification.sustainabilityScore > 70) {
    recommendations.push("🌟 High sustainability value - excellent for green metrics")
  }
  
  if (classification.environmentalImpact.co2_saved_kg > 10) {
    recommendations.push(`🌍 Significant CO₂ impact: ${classification.environmentalImpact.co2_saved_kg}kg saved`)
  }
  
  return recommendations
}

export async function GET() {
  return NextResponse.json({
    status: "Smart E-Waste Classification API is running",
    endpoint: "POST /api/items/classify",
    description: "Intelligent categorization system for optimal sustainability outcomes"
  })
}
