"use client"

import { useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken, getAuthUser } from "@/lib/auth"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const token = getAuthToken()
    const user = getAuthUser()

    console.log("[ProtectedRoute] token:", token)
    console.log("[ProtectedRoute] user:", user)

    if (!token || !user) {
      router.replace("/login")
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/login")
      return
    }

    setIsAuthorized(true)
    setIsReady(true)
  }, [router, allowedRoles])

  if (!isReady) return <p>Checking authentication...</p>
  if (!isAuthorized) return null

  return <>{children}</>
}
