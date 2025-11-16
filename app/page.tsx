import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Redirect to dashboard based on role
  if (session.user.role === "admin") {
    redirect("/admin")
  } else {
    redirect("/dashboard")
  }
}
