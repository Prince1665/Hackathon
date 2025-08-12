import { NextResponse } from "next/server"
import { listVendors } from "@/lib/server/db"

export async function GET() {
  const rows = await listVendors()
  return NextResponse.json(rows)
}
