import { NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  return NextResponse.json(session || { user: null }, { headers: { "Cache-Control": "no-store" } })
}

