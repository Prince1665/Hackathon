// Environmental Impact Calculation Utilities
// Based on CPCB guidelines and international e-waste impact studies

export interface EnvironmentalImpact {
  carbonFootprintSaved: number // kg CO2 equivalent
  energySaved: number // kWh
  waterSaved: number // liters
  landfillDiverted: number // kg
  toxicMaterialsHandled: number // kg
  recycledMaterials: {
    metals: number // kg
    plastics: number // kg
    glass: number // kg
    rareEarths: number // kg
  }
  economicValue: number // INR
}

// E-waste category impact factors (per kg)
const IMPACT_FACTORS = {
  // Carbon footprint saved by proper recycling vs landfill (kg CO2/kg)
  carbonFootprint: {
    'Mobile Phones': 70, // High due to manufacturing complexity
    'Laptops': 85,
    'Desktop Computers': 90,
    'Tablets': 65,
    'Televisions': 120,
    'Refrigerators': 150,
    'Washing Machines': 140,
    'Air Conditioners': 160,
    'Printers': 45,
    'Keyboards': 15,
    'Mice': 8,
    'Cables': 5,
    'Batteries': 25,
    'Chargers': 12,
    'Other Electronics': 40
  },
  
  // Energy saved through recycling vs new production (kWh/kg)
  energySaved: {
    'Mobile Phones': 95,
    'Laptops': 110,
    'Desktop Computers': 125,
    'Tablets': 80,
    'Televisions': 180,
    'Refrigerators': 220,
    'Washing Machines': 200,
    'Air Conditioners': 250,
    'Printers': 60,
    'Keyboards': 20,
    'Mice': 12,
    'Cables': 8,
    'Batteries': 35,
    'Chargers': 18,
    'Other Electronics': 55
  },
  
  // Water saved in manufacturing process (liters/kg)
  waterSaved: {
    'Mobile Phones': 1200,
    'Laptops': 1500,
    'Desktop Computers': 1800,
    'Tablets': 1000,
    'Televisions': 2500,
    'Refrigerators': 3000,
    'Washing Machines': 2800,
    'Air Conditioners': 3500,
    'Printers': 800,
    'Keyboards': 300,
    'Mice': 150,
    'Cables': 100,
    'Batteries': 500,
    'Chargers': 250,
    'Other Electronics': 900
  },
  
  // Toxic materials content (kg toxic materials/kg device)
  toxicMaterials: {
    'Mobile Phones': 0.15,
    'Laptops': 0.12,
    'Desktop Computers': 0.18,
    'Tablets': 0.10,
    'Televisions': 0.25,
    'Refrigerators': 0.30,
    'Washing Machines': 0.08,
    'Air Conditioners': 0.35,
    'Printers': 0.06,
    'Keyboards': 0.02,
    'Mice': 0.01,
    'Cables': 0.05,
    'Batteries': 0.80, // High due to heavy metals
    'Chargers': 0.03,
    'Other Electronics': 0.10
  },
  
  // Material composition for recycling (percentage)
  materialComposition: {
    'Mobile Phones': { metals: 0.60, plastics: 0.25, glass: 0.10, rareEarths: 0.05 },
    'Laptops': { metals: 0.55, plastics: 0.30, glass: 0.12, rareEarths: 0.03 },
    'Desktop Computers': { metals: 0.65, plastics: 0.25, glass: 0.08, rareEarths: 0.02 },
    'Tablets': { metals: 0.50, plastics: 0.30, glass: 0.18, rareEarths: 0.02 },
    'Televisions': { metals: 0.45, plastics: 0.35, glass: 0.18, rareEarths: 0.02 },
    'Refrigerators': { metals: 0.70, plastics: 0.25, glass: 0.03, rareEarths: 0.02 },
    'Washing Machines': { metals: 0.75, plastics: 0.20, glass: 0.03, rareEarths: 0.02 },
    'Air Conditioners': { metals: 0.68, plastics: 0.25, glass: 0.05, rareEarths: 0.02 },
    'Printers': { metals: 0.40, plastics: 0.50, glass: 0.08, rareEarths: 0.02 },
    'Keyboards': { metals: 0.30, plastics: 0.65, glass: 0.03, rareEarths: 0.02 },
    'Mice': { metals: 0.25, plastics: 0.70, glass: 0.03, rareEarths: 0.02 },
    'Cables': { metals: 0.60, plastics: 0.38, glass: 0.00, rareEarths: 0.02 },
    'Batteries': { metals: 0.85, plastics: 0.10, glass: 0.00, rareEarths: 0.05 },
    'Chargers': { metals: 0.45, plastics: 0.50, glass: 0.03, rareEarths: 0.02 },
    'Other Electronics': { metals: 0.50, plastics: 0.35, glass: 0.10, rareEarths: 0.05 }
  },
  
  // Economic value of recovered materials (INR/kg)
  economicValue: {
    'Mobile Phones': 2500, // High value due to precious metals
    'Laptops': 1800,
    'Desktop Computers': 1200,
    'Tablets': 1500,
    'Televisions': 800,
    'Refrigerators': 600,
    'Washing Machines': 500,
    'Air Conditioners': 700,
    'Printers': 400,
    'Keyboards': 150,
    'Mice': 100,
    'Cables': 200,
    'Batteries': 300,
    'Chargers': 180,
    'Other Electronics': 600
  }
}

export function calculateEnvironmentalImpact(items: Array<{
  category: string
  weight?: number
  quantity?: number
}>): EnvironmentalImpact {
  let totalImpact: EnvironmentalImpact = {
    carbonFootprintSaved: 0,
    energySaved: 0,
    waterSaved: 0,
    landfillDiverted: 0,
    toxicMaterialsHandled: 0,
    recycledMaterials: {
      metals: 0,
      plastics: 0,
      glass: 0,
      rareEarths: 0
    },
    economicValue: 0
  }

  items.forEach(item => {
    // Estimate weight if not provided (average weights in kg)
    const estimatedWeight = item.weight || getEstimatedWeight(item.category) * (item.quantity || 1)
    
    const category = item.category as keyof typeof IMPACT_FACTORS.carbonFootprint
    
    // Calculate impacts
    totalImpact.carbonFootprintSaved += estimatedWeight * (IMPACT_FACTORS.carbonFootprint[category] || IMPACT_FACTORS.carbonFootprint['Other Electronics'])
    totalImpact.energySaved += estimatedWeight * (IMPACT_FACTORS.energySaved[category] || IMPACT_FACTORS.energySaved['Other Electronics'])
    totalImpact.waterSaved += estimatedWeight * (IMPACT_FACTORS.waterSaved[category] || IMPACT_FACTORS.waterSaved['Other Electronics'])
    totalImpact.landfillDiverted += estimatedWeight
    totalImpact.toxicMaterialsHandled += estimatedWeight * (IMPACT_FACTORS.toxicMaterials[category] || IMPACT_FACTORS.toxicMaterials['Other Electronics'])
    
    // Calculate recycled materials
    const composition = IMPACT_FACTORS.materialComposition[category] || IMPACT_FACTORS.materialComposition['Other Electronics']
    totalImpact.recycledMaterials.metals += estimatedWeight * composition.metals
    totalImpact.recycledMaterials.plastics += estimatedWeight * composition.plastics
    totalImpact.recycledMaterials.glass += estimatedWeight * composition.glass
    totalImpact.recycledMaterials.rareEarths += estimatedWeight * composition.rareEarths
    
    // Calculate economic value
    totalImpact.economicValue += estimatedWeight * (IMPACT_FACTORS.economicValue[category] || IMPACT_FACTORS.economicValue['Other Electronics'])
  })

  return totalImpact
}

function getEstimatedWeight(category: string): number {
  // Average weights in kg
  const weights: { [key: string]: number } = {
    'Mobile Phones': 0.2,
    'Laptops': 2.5,
    'Desktop Computers': 8.0,
    'Tablets': 0.6,
    'Televisions': 15.0,
    'Refrigerators': 60.0,
    'Washing Machines': 70.0,
    'Air Conditioners': 45.0,
    'Printers': 5.0,
    'Keyboards': 0.8,
    'Mice': 0.1,
    'Cables': 0.3,
    'Batteries': 0.5,
    'Chargers': 0.2,
    'Other Electronics': 2.0
  }
  
  return weights[category] || weights['Other Electronics']
}

export function formatImpactForDisplay(impact: EnvironmentalImpact) {
  return {
    carbonFootprint: `${impact.carbonFootprintSaved.toFixed(1)} kg CO₂`,
    energy: `${impact.energySaved.toFixed(1)} kWh`,
    water: `${impact.waterSaved.toLocaleString()} liters`,
    landfill: `${impact.landfillDiverted.toFixed(1)} kg`,
    toxicMaterials: `${impact.toxicMaterialsHandled.toFixed(2)} kg`,
    economicValue: `₹${impact.economicValue.toLocaleString()}`,
    materials: {
      metals: `${impact.recycledMaterials.metals.toFixed(1)} kg`,
      plastics: `${impact.recycledMaterials.plastics.toFixed(1)} kg`,
      glass: `${impact.recycledMaterials.glass.toFixed(1)} kg`,
      rareEarths: `${impact.recycledMaterials.rareEarths.toFixed(2)} kg`
    }
  }
}
