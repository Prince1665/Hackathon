import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/server/auth"

export async function GET() {
  const session = await getSession()
  const cookieStore = await cookies()
  const signupDone = cookieStore.get("signup_done")?.value === "1"
  return NextResponse.json({ user: session?.user || null, signupDone })
}