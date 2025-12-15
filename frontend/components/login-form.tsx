"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { saveAuthData, User } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<{
    email: string
    password: string
    role: "admin" | "vendor" | "user"
    vendor_domain: string
  }>({
    email: "",
    password: "",
    role: "user",
    vendor_domain: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("[Login] Attempting login with:", formData)

    try {
      const response = await api.login(formData)
      console.log("[Login] Full response:", response)

      // Build a strongly typed User object
      const user: User = {
        email: response.vendor?.email || formData.email,
        role: response.vendor?.role as "admin" | "vendor" | "user" || formData.role,
        vendor_domain: response.vendor?.domain || formData.vendor_domain,
      }

      saveAuthData(response.access_token, user)

      console.log("[Login] Stored token:", localStorage.getItem("token"))
      console.log("[Login] Stored user:", localStorage.getItem("user"))

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.email}!`,
      })

      // Redirect according to role
      if (user.role === "vendor") router.push("/vendor")
      else if (user.role === "admin") router.push("/admin")
      else router.push("/chat")
    } catch (error) {
      console.error("[Login] Error:", error)
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as "admin" | "vendor" | "user" })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.role === "vendor" && (
            <div className="space-y-2">
              <Label htmlFor="vendor_domain">Vendor Domain</Label>
              <Input
                id="vendor_domain"
                type="text"
                placeholder="your-company"
                value={formData.vendor_domain}
                onChange={(e) => setFormData({ ...formData, vendor_domain: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
