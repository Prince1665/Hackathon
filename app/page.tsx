import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/server/auth"
import { SignupDialog } from "@/components/signup-dialog"

export default async function Page() {
  const session = await getSession()
  if (session) {
    const role = session.user.role
    if (role === "admin" || role === "coordinator") redirect("/admin")
    if (role === "vendor") redirect("/vendor/scan")
    redirect("/report")
  }

  const cookieStore = await cookies()
  const signupDone = cookieStore.get("signup_done")?.value === "1"
  if (signupDone) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen grid place-items-center">
      {/* Signup dialog opens immediately for first-time visitors */}
      {/* @ts-expect-error Server Component embedding client component */}
      <SignupDialog open onOpenChange={() => {}} />
    </main>
  )
}
