import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ 
      user: {
        user_id: session.user.user_id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    })
  } catch (error) {
    console.error("Error fetching user info:", error)
    return NextResponse.json({ error: "Failed to fetch user info" }, { status: 500 })
  }
}
