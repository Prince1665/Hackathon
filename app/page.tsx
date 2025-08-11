import { redirect } from "next/navigation"
import { getSession } from "@/lib/server/auth"

export default async function Page() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  const role = session.user.role
  if (role === "admin" || role === "coordinator") {
    redirect("/admin")
  }
  if (role === "vendor") {
    redirect("/vendor/scan")
  }
  redirect("/report")
}
