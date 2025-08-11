import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LoginLandingPage() {
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Select your role to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button asChild>
            <Link href="/login/admin">Admin</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login/student">Student / Resident</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login/faculty">Faculty / Coordinator</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login/vendor">E‑waste Vendor</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}