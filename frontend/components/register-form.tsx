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
import { Loader2 } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "user" as "admin" | "vendor" | "user",
    vendor_domain: "",
    company_name: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("[v0] Registration attempt started", {
      email: formData.email,
      role: formData.role,
      vendor_domain: formData.vendor_domain,
    })

    try {
      let response

      // Call appropriate create endpoint based on role
      if (formData.role === "admin") {
        response = await api.createAdmin({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        })
      } else if (formData.role === "vendor") {
        if (!formData.vendor_domain || !formData.company_name) {
          throw new Error("Vendor domain and company name are required for vendor registration")
        }
        response = await api.createVendor({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          vendor_domain: formData.vendor_domain,
          company_name: formData.company_name,
        })
      } else {
        response = await api.createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        })
      }

      console.log("[v0] Registration successful", response)

      toast({
        title: "Registration successful",
        description: "Your account has been created. Please login.",
      })

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("[v0] Registration error:", error)

      const errorMessage = error instanceof Error ? error.message : "Registration failed"
      console.log("[v0] Error message:", errorMessage)

      toast({
        title: "Registration failed",
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
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Fill in your details to create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

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
            <>
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  type="text"
                  placeholder="Acme Inc."
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_domain">Vendor Domain</Label>
                <Input
                  id="vendor_domain"
                  type="text"
                  placeholder="acme"
                  value={formData.vendor_domain}
                  onChange={(e) => setFormData({ ...formData, vendor_domain: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
