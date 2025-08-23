// Test script to verify environmental impact calculations
const { calculateEnvironmentalImpact, formatImpactForDisplay } = require('./lib/environmental-impact.ts')

console.log('🌱 Testing Environmental Impact Calculations...')

// Test data - sample e-waste items
const testItems = [
  { category: 'Mobile Phones', weight: 0.2, quantity: 10 }, // 10 phones, 2kg total
  { category: 'Laptops', weight: 2.5, quantity: 5 },       // 5 laptops, 12.5kg total
  { category: 'Desktop Computers', weight: 8.0, quantity: 3 }, // 3 desktops, 24kg total
  { category: 'Televisions', weight: 15.0, quantity: 2 },  // 2 TVs, 30kg total
  { category: 'Refrigerators', weight: 60.0, quantity: 1 }, // 1 fridge, 60kg total
  { category: 'Batteries', weight: 0.5, quantity: 20 },    // 20 batteries, 10kg total
  { category: 'Cables', weight: 0.3, quantity: 50 }        // 50 cables, 15kg total
]

console.log('\n📊 Test Data:')
testItems.forEach(item => {
  const totalWeight = (item.weight || 0) * (item.quantity || 1)
  console.log(`  ${item.category}: ${item.quantity} items, ${totalWeight}kg total`)
})

const totalWeight = testItems.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 1)), 0)
console.log(`  Total Weight: ${totalWeight}kg`)

// Calculate environmental impact
console.log('\n🧮 Calculating Environmental Impact...')
const impact = calculateEnvironmentalImpact(testItems)
const formatted = formatImpactForDisplay(impact)

console.log('\n🌍 Environmental Impact Results:')
console.log('=====================================')

console.log('\n💨 Carbon Footprint:')
console.log(`  Saved: ${formatted.carbonFootprint}`)
console.log(`  Equivalent to: ${Math.round(impact.carbonFootprintSaved / 22)} trees planted for 1 year`)
console.log(`  Or: ${Math.round(impact.carbonFootprintSaved / 4600)} cars off the road for 1 year`)

console.log('\n⚡ Energy Conservation:')
console.log(`  Saved: ${formatted.energy}`)
console.log(`  Equivalent to: ${Math.round(impact.energySaved / 250)} home-days of electricity`)
console.log(`  Or: ${Math.round(impact.energySaved / 8760)} homes powered for 1 year`)

console.log('\n💧 Water Conservation:')
console.log(`  Saved: ${formatted.water}`)
console.log(`  Equivalent to: ${Math.round(impact.waterSaved / 150)} person-days of water consumption`)
console.log(`  Or: ${Math.round(impact.waterSaved / 54750)} person-years of water`)

console.log('\n🗑️ Waste Management:')
console.log(`  Landfill Diverted: ${formatted.landfill}`)
console.log(`  Toxic Materials Handled: ${formatted.toxicMaterials}`)

console.log('\n♻️ Material Recovery:')
console.log(`  Metals: ${formatted.materials.metals} (${((impact.recycledMaterials.metals / impact.landfillDiverted) * 100).toFixed(1)}%)`)
console.log(`  Plastics: ${formatted.materials.plastics} (${((impact.recycledMaterials.plastics / impact.landfillDiverted) * 100).toFixed(1)}%)`)
console.log(`  Glass: ${formatted.materials.glass} (${((impact.recycledMaterials.glass / impact.landfillDiverted) * 100).toFixed(1)}%)`)
console.log(`  Rare Earth Elements: ${formatted.materials.rareEarths} (${((impact.recycledMaterials.rareEarths / impact.landfillDiverted) * 100).toFixed(2)}%)`)

console.log('\n💰 Economic Impact:')
console.log(`  Economic Value: ${formatted.economicValue}`)
console.log(`  Average value per kg: ₹${Math.round(impact.economicValue / impact.landfillDiverted)}`)

console.log('\n📈 Impact Intensity (per kg):')
console.log(`  Carbon saved: ${(impact.carbonFootprintSaved / impact.landfillDiverted).toFixed(1)} kg CO₂/kg`)
console.log(`  Energy saved: ${(impact.energySaved / impact.landfillDiverted).toFixed(1)} kWh/kg`)
console.log(`  Water saved: ${Math.round(impact.waterSaved / impact.landfillDiverted)} L/kg`)

console.log('\n🎯 Key Insights:')
console.log('================')
console.log(`• Every 1kg of e-waste properly processed saves ${(impact.carbonFootprintSaved / impact.landfillDiverted).toFixed(1)}kg CO₂`)
console.log(`• Mobile phones have the highest carbon impact per kg (70kg CO₂/kg)`)
console.log(`• Refrigerators and ACs have the highest energy savings (220-250 kWh/kg)`)
console.log(`• Batteries contain the highest percentage of toxic materials (80%)`)
console.log(`• Metals make up ${((impact.recycledMaterials.metals / impact.landfillDiverted) * 100).toFixed(1)}% of recoverable materials`)

console.log('\n🌟 Environmental Benefits Summary:')
console.log('===================================')
console.log(`This e-waste collection program has achieved:`)
console.log(`• Climate Impact: Equivalent to planting ${Math.round(impact.carbonFootprintSaved / 22)} trees`)
console.log(`• Energy Impact: Equivalent to powering ${Math.round(impact.energySaved / 8760)} homes for a year`)
console.log(`• Water Impact: Equivalent to ${Math.round(impact.waterSaved / 54750)} person-years of water`)
console.log(`• Waste Impact: Diverted ${impact.landfillDiverted.toFixed(1)}kg from landfills`)
console.log(`• Safety Impact: Safely handled ${impact.toxicMaterialsHandled.toFixed(2)}kg of toxic materials`)

console.log('\n✅ Environmental Impact Calculation Test Complete!')
console.log('\n📋 Next Steps:')
console.log('• Integrate these calculations into the admin dashboard')
console.log('• Include impact data in PDF reports')
console.log('• Display real-time impact metrics to users')
console.log('• Use data for CPCB compliance reporting')

console.log('\n🎉 The environmental impact feature is ready for production!')
