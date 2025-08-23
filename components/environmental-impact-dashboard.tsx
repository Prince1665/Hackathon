"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Leaf, Droplets, Zap, Trash2, AlertTriangle, DollarSign, Recycle, TreePine } from "lucide-react"
import { type EnvironmentalImpact } from "@/lib/environmental-impact"

interface EnvironmentalImpactDashboardProps {
  impact: EnvironmentalImpact
  className?: string
}

export function EnvironmentalImpactDashboard({ impact, className }: EnvironmentalImpactDashboardProps) {
  // Calculate equivalent metrics for better understanding
  const treesEquivalent = Math.round(impact.carbonFootprintSaved / 22) // 1 tree absorbs ~22kg CO2/year
  const homeDaysEquivalent = Math.round(impact.energySaved / 250) // Average home uses ~250 kWh/month
  const personDaysWater = Math.round(impact.waterSaved / 150) // Average person uses ~150L/day
  const carsOffRoad = Math.round(impact.carbonFootprintSaved / 4600) // Average car emits ~4.6 tons CO2/year

  const impactMetrics = [
    {
      title: "Carbon Footprint Saved",
      value: impact.carbonFootprintSaved.toFixed(1),
      unit: "kg CO₂",
      equivalent: `${treesEquivalent} trees planted`,
      icon: Leaf,
      color: "green",
      description: "CO₂ emissions prevented through proper recycling vs landfill disposal"
    },
    {
      title: "Energy Saved",
      value: impact.energySaved.toFixed(1),
      unit: "kWh",
      equivalent: `${homeDaysEquivalent} home-days`,
      icon: Zap,
      color: "blue",
      description: "Energy conserved by recycling materials instead of producing new ones"
    },
    {
      title: "Water Conserved",
      value: impact.waterSaved.toLocaleString(),
      unit: "liters",
      equivalent: `${personDaysWater} person-days`,
      icon: Droplets,
      color: "cyan",
      description: "Water saved in manufacturing processes through material recovery"
    },
    {
      title: "Waste Diverted",
      value: impact.landfillDiverted.toFixed(1),
      unit: "kg",
      equivalent: "from landfills",
      icon: Trash2,
      color: "purple",
      description: "Electronic waste properly processed instead of landfill disposal"
    },
    {
      title: "Toxic Materials",
      value: impact.toxicMaterialsHandled.toFixed(2),
      unit: "kg",
      equivalent: "safely handled",
      icon: AlertTriangle,
      color: "red",
      description: "Hazardous substances properly managed to prevent environmental contamination"
    },
    {
      title: "Economic Value",
      value: `₹${impact.economicValue.toLocaleString()}`,
      unit: "",
      equivalent: "materials recovered",
      icon: DollarSign,
      color: "yellow",
      description: "Economic value of materials recovered through proper e-waste processing"
    }
  ]

  const materialMetrics = [
    {
      title: "Metals Recycled",
      value: impact.recycledMaterials.metals.toFixed(1),
      unit: "kg",
      percentage: ((impact.recycledMaterials.metals / impact.landfillDiverted) * 100).toFixed(1),
      icon: Recycle,
      color: "indigo"
    },
    {
      title: "Plastics Recycled",
      value: impact.recycledMaterials.plastics.toFixed(1),
      unit: "kg",
      percentage: ((impact.recycledMaterials.plastics / impact.landfillDiverted) * 100).toFixed(1),
      icon: Recycle,
      color: "pink"
    },
    {
      title: "Glass Recycled",
      value: impact.recycledMaterials.glass.toFixed(1),
      unit: "kg",
      percentage: ((impact.recycledMaterials.glass / impact.landfillDiverted) * 100).toFixed(1),
      icon: Recycle,
      color: "teal"
    },
    {
      title: "Rare Earth Elements",
      value: impact.recycledMaterials.rareEarths.toFixed(2),
      unit: "kg",
      percentage: ((impact.recycledMaterials.rareEarths / impact.landfillDiverted) * 100).toFixed(2),
      icon: Recycle,
      color: "orange"
    }
  ]

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: "border-green-200 bg-gradient-to-br from-green-50 to-transparent text-green-700",
      blue: "border-blue-200 bg-gradient-to-br from-blue-50 to-transparent text-blue-700",
      cyan: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-transparent text-cyan-700",
      purple: "border-purple-200 bg-gradient-to-br from-purple-50 to-transparent text-purple-700",
      red: "border-red-200 bg-gradient-to-br from-red-50 to-transparent text-red-700",
      yellow: "border-yellow-200 bg-gradient-to-br from-yellow-50 to-transparent text-yellow-700",
      indigo: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-transparent text-indigo-700",
      pink: "border-pink-200 bg-gradient-to-br from-pink-50 to-transparent text-pink-700",
      teal: "border-teal-200 bg-gradient-to-br from-teal-50 to-transparent text-teal-700",
      orange: "border-orange-200 bg-gradient-to-br from-orange-50 to-transparent text-orange-700"
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.green
  }

  const getValueColorClasses = (color: string) => {
    const colorMap = {
      green: "text-green-600",
      blue: "text-blue-600",
      cyan: "text-cyan-600",
      purple: "text-purple-600",
      red: "text-red-600",
      yellow: "text-yellow-600",
      indigo: "text-indigo-600",
      pink: "text-pink-600",
      teal: "text-teal-600",
      orange: "text-orange-600"
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.green
  }

  return (
    <div className={className}>
      {/* Main Impact Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {impactMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={index}
              className={`rounded-md border p-4 ${getColorClasses(metric.color)} hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" />
                <div className="text-xs font-medium">{metric.title}</div>
              </div>
              <div className={`text-2xl font-bold ${getValueColorClasses(metric.color)}`}>
                {metric.value} {metric.unit}
              </div>
              <div className="text-xs mt-1 opacity-80">
                {metric.equivalent}
              </div>
              <div className="text-xs mt-2 opacity-70">
                {metric.description}
              </div>
            </div>
          )
        })}
      </div>

      {/* Material Recovery Breakdown */}
      <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-[#3e5f44] flex items-center gap-2">
            <Recycle className="h-5 w-5" />
            Material Recovery Breakdown
          </CardTitle>
          <CardDescription className="text-[#3e5f44]/70">
            Detailed breakdown of materials recovered through proper e-waste processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {materialMetrics.map((material, index) => {
              const Icon = material.icon
              return (
                <div
                  key={index}
                  className={`rounded-md border p-4 ${getColorClasses(material.color)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <div className="text-xs font-medium">{material.title}</div>
                  </div>
                  <div className={`text-xl font-bold ${getValueColorClasses(material.color)}`}>
                    {material.value} {material.unit}
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {material.percentage}% of total
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Environmental Equivalents */}
      <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200 mt-6">
        <CardHeader>
          <CardTitle className="text-[#3e5f44] flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Environmental Equivalents
          </CardTitle>
          <CardDescription className="text-[#3e5f44]/70">
            Real-world equivalents to help understand the environmental impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <TreePine className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-semibold text-green-800">Trees Planted Equivalent</div>
                  <div className="text-sm text-green-600">{treesEquivalent} trees for 1 year</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Zap className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-800">Home Energy Equivalent</div>
                  <div className="text-sm text-blue-600">Power a home for {homeDaysEquivalent} days</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                <Droplets className="h-6 w-6 text-cyan-600" />
                <div>
                  <div className="font-semibold text-cyan-800">Water Conservation</div>
                  <div className="text-sm text-cyan-600">{personDaysWater} person-days of water</div>
                </div>
              </div>
              {carsOffRoad > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <Leaf className="h-6 w-6 text-purple-600" />
                  <div>
                    <div className="font-semibold text-purple-800">Cars Off Road</div>
                    <div className="text-sm text-purple-600">{carsOffRoad} cars for 1 year</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
