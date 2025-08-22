export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { listItems, listDepartments, listVendors } from "@/lib/server/data-mongo"
import { getDb } from "@/lib/server/mongo"

// Health check API to verify all system components are working
export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    checks: {}
  }

  try {
    // 1. Database connectivity check
    try {
      const db = await getDb()
      const collections = await db.listCollections().toArray()
      results.checks.database = {
        status: "ok",
        collections: collections.map(c => c.name)
      }
    } catch (error) {
      results.checks.database = {
        status: "error",
        error: error instanceof Error ? error.message : "Database connection failed"
      }
      results.status = "unhealthy"
    }

    // 2. Items API check
    try {
      const items = await listItems()
      results.checks.items = {
        status: "ok",
        count: Array.isArray(items) ? items.length : 0
      }
    } catch (error) {
      results.checks.items = {
        status: "error",
        error: error instanceof Error ? error.message : "Items fetch failed"
      }
      results.status = "unhealthy"
    }

    // 3. Departments API check
    try {
      const departments = await listDepartments()
      results.checks.departments = {
        status: "ok",
        count: Array.isArray(departments) ? departments.length : 0
      }
    } catch (error) {
      results.checks.departments = {
        status: "error",
        error: error instanceof Error ? error.message : "Departments fetch failed"
      }
      results.status = "unhealthy"
    }

    // 4. Vendors API check
    try {
      const vendors = await listVendors()
      results.checks.vendors = {
        status: "ok",
        count: Array.isArray(vendors) ? vendors.length : 0
      }
    } catch (error) {
      results.checks.vendors = {
        status: "error",
        error: error instanceof Error ? error.message : "Vendors fetch failed"
      }
      results.status = "unhealthy"
    }

    // 5. Price prediction API check
    try {
      const priceResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3002'}/api/predict-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Laptop',
          original_price: 50000,
          used_duration: 2,
          user_lifespan: 5,
          condition: 3,
          build_quality: 3
        })
      })
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        results.checks.price_prediction = {
          status: "ok",
          predicted_price: priceData.predicted_price
        }
      } else {
        results.checks.price_prediction = {
          status: "error",
          error: `API returned ${priceResponse.status}`
        }
      }
    } catch (error) {
      results.checks.price_prediction = {
        status: "error",
        error: error instanceof Error ? error.message : "Price prediction failed"
      }
    }

    // 6. Classification API check
    try {
      const classificationResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3002'}/api/items/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Laptop',
          condition: 3,
          age: 2,
          brand: 'Dell'
        })
      })
      
      if (classificationResponse.ok) {
        const classData = await classificationResponse.json()
        results.checks.classification = {
          status: "ok",
          disposition: classData.classification?.disposition
        }
      } else {
        results.checks.classification = {
          status: "error",
          error: `API returned ${classificationResponse.status}`
        }
      }
    } catch (error) {
      results.checks.classification = {
        status: "error",
        error: error instanceof Error ? error.message : "Classification failed"
      }
    }

    // 7. Analytics API check
    try {
      const analyticsResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3002'}/api/analytics/advanced`)
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        results.checks.analytics = {
          status: "ok",
          has_data: !!analyticsData.data
        }
      } else {
        results.checks.analytics = {
          status: "error",
          error: `API returned ${analyticsResponse.status}`
        }
      }
    } catch (error) {
      results.checks.analytics = {
        status: "error",
        error: error instanceof Error ? error.message : "Analytics failed"
      }
    }

    // 8. Engagement API check
    try {
      const engagementResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3002'}/api/engagement`)
      
      if (engagementResponse.ok) {
        const engagementData = await engagementResponse.json()
        results.checks.engagement = {
          status: "ok",
          has_challenges: !!engagementData.challenges,
          has_leaderboards: !!engagementData.leaderboards
        }
      } else {
        results.checks.engagement = {
          status: "error",
          error: `API returned ${engagementResponse.status}`
        }
      }
    } catch (error) {
      results.checks.engagement = {
        status: "error",
        error: error instanceof Error ? error.message : "Engagement failed"
      }
    }

    // Calculate overall health
    const totalChecks = Object.keys(results.checks).length
    const healthyChecks = Object.values(results.checks).filter((check: any) => check.status === "ok").length
    results.health_score = Math.round((healthyChecks / totalChecks) * 100)

    if (results.health_score < 80) {
      results.status = "unhealthy"
    } else if (results.health_score < 100) {
      results.status = "degraded"
    }

    return NextResponse.json(results, { 
      status: results.status === "healthy" ? 200 : 503 
    })

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: "error",
      error: error instanceof Error ? error.message : "Health check failed",
      checks: results.checks
    }, { status: 500 })
  }
}

// Simple GET endpoint for basic health check
export async function HEAD() {
  return new Response(null, { status: 200 })
}
