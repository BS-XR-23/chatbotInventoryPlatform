"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { saveAuthData } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user" as "admin" | "vendor" | "user",
    vendor_domain: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("[v0] Login attempt started", {
      email: formData.email,
      role: formData.role,
      vendor_domain: formData.vendor_domain,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    })

    try {
      const response = await api.login(formData)

      console.log("[v0] Login response received", {
        hasToken: !!response.access_token,
        tokenType: response.token_type,
        fullResponse: response,
      })

      saveAuthData(response.access_token, formData.role, formData.email, formData.vendor_domain)

      toast({
        title: "Login successful",
        description: `Welcome back, ${formData.email}!`,
      })

      const redirectMap = {
        admin: "/admin",
        vendor: "/vendor",
        user: "/chat",
      }

      console.log("[v0] Redirecting to", redirectMap[formData.role])
      router.push(redirectMap[formData.role] || "/")
    } catch (error) {
      console.error("[v0] Login error:", error)

      let errorMessage = "Invalid credentials. Please check your email, password, and role."

      if (error instanceof Error) {
        errorMessage = error.message
      }

      console.log("[v0] Error message:", errorMessage)
      console.log("[v0] Error details:", JSON.stringify(error, null, 2))

      toast({
        title: "Login failed",
        description: errorMessage,
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
              onValueChange={(value) => setFormData({ ...formData, role: value as "admin" | "vendor" | "user" })}
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
