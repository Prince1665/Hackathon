import { NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"

export async function GET() {
  try {
    const session = await getSession()
    return NextResponse.json({ session: session || null })
  } catch (error) {
    console.error("Error getting session:", error)
    // Return null session instead of throwing during build
    return NextResponse.json({ session: null })
  }
}

