import { NextResponse } from "next/server"
import { listDepartments } from "@/lib/server/db"

export async function GET() {
  const rows = await listDepartments()
  return NextResponse.json(rows)
}
