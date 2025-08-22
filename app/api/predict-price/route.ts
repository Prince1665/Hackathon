export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        error: "Invalid request body",
        status: "error" 
      }, { status: 400 })
    }
    
    // Validate numeric fields
    const numericFields = ['original_price', 'used_duration', 'user_lifespan', 'condition', 'build_quality']
    for (const field of numericFields) {
      if (body[field] !== undefined && (typeof body[field] !== 'number' || isNaN(body[field]) || body[field] < 0)) {
        return NextResponse.json({ 
          error: `Invalid ${field}: must be a positive number`,
          status: "error" 
        }, { status: 400 })
      }
    }
    
    // For now, we'll use a simple heuristic until Python model is set up
    // This can be replaced with actual Python model integration
    const predictedPrice = calculatePriceHeuristic(body)
    
    if (!predictedPrice || isNaN(predictedPrice)) {
      return NextResponse.json({ 
        error: "Failed to calculate price prediction",
        status: "error" 
      }, { status: 500 })
    }
    
    const originalPrice = body.original_price || 50000
    const co2Savings = Math.round(originalPrice / 10000)
    const refurbishmentSavings = Math.round(predictedPrice * 0.7)
    
    return NextResponse.json({ 
      predicted_price: predictedPrice,
      status: "success",
      sustainability_note: `Refurbishing this item could save ₹${refurbishmentSavings} compared to buying new, while preventing ${co2Savings}kg CO₂ emissions.`,
      refurbishment_viability: predictedPrice > (originalPrice * 0.3) ? "High" : predictedPrice > (originalPrice * 0.15) ? "Medium" : "Low",
      note: "Using heuristic calculation. Integrate Python ML model for better accuracy.",
      confidence_score: Math.round(Math.min(95, 70 + (body.condition || 3) * 5)) // Mock confidence score
    })
  } catch (error) {
    console.error("Price prediction error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to predict price",
      status: "error"
    }, { status: 500 })
  }
}

function calculatePriceHeuristic(itemData: any): number {
  const {
    original_price = 50000,
    used_duration = 2,
    user_lifespan = 5,
    condition = 3,
    build_quality = 3,
    category = "Laptop"
  } = itemData

  // Basic depreciation calculation
  let depreciationRate = 0.15 // 15% per year base rate
  
  // Adjust depreciation based on category
  const categoryMultipliers: Record<string, number> = {
    'Laptop': 0.2,
    'Smartphone': 0.25,
    'Tablet': 0.18,
    'TV': 0.12,
    'Refrigerator': 0.08,
    'Washing Machine': 0.1,
    'Air Conditioner': 0.12,
    'Microwave': 0.15
  }
  
  depreciationRate = categoryMultipliers[category] || 0.15
  
  // Adjust for condition (1-5 scale)
  const conditionMultiplier = Math.max(0.1, condition / 5)
  
  // Adjust for build quality (1-5 scale)
  const qualityMultiplier = Math.max(0.8, 0.8 + (build_quality - 3) * 0.1)
  
  // Calculate depreciated value
  const yearsUsed = Math.min(used_duration, user_lifespan)
  const depreciatedValue = original_price * Math.pow(1 - depreciationRate, yearsUsed)
  
  // Apply condition and quality adjustments
  let currentPrice = depreciatedValue * conditionMultiplier * qualityMultiplier
  
  // Ensure minimum value (5% of original price)
  currentPrice = Math.max(currentPrice, original_price * 0.05)
  
  return Math.round(currentPrice)
}

export async function GET() {
  return NextResponse.json({
    status: "Price prediction API is running",
    endpoint: "POST /api/predict-price",
    note: "Send item data to get price prediction"
  })
}
