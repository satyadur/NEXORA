"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "./_components/LoginForm"
import { useMe } from "@/hooks/use-me"

export default function LoginPage() {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN") router.push("/admin")
      if (user.role === "TEACHER") router.push("/teacher")
      if (user.role === "STUDENT") router.push("/student")
    }
  }, [user, isLoading, router])

  if (isLoading) return null

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
