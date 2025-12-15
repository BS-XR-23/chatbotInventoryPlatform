"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth"
import { api } from "@/lib/api"
import { LogOut, Users, Bot, MessageSquare } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalChatbots: 0,
    mostUsedChatbot: null as any,
  })
  const [loading, setLoading] = useState(true)
  const user = getAuthUser()

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "admin") {
      router.push("/login")
      return
    }

    loadAdminData()
  }, [router, user])

  const loadAdminData = async () => {
    try {
      const [vendors, chatbots, mostUsed] = await Promise.all([
        api.getAllVendors(),
        api.getAllChatbots(),
        api.getMostUsedChatbot(),
      ])

      setStats({
        totalVendors: vendors?.length || 0,
        totalChatbots: chatbots?.length || 0,
        mostUsedChatbot: mostUsed,
      })
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthData()
    router.push("/login")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalVendors}</div>
              <p className="text-xs text-muted-foreground">Registered vendors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chatbots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalChatbots}</div>
              <p className="text-xs text-muted-foreground">Active chatbots</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Used Chatbot</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.mostUsedChatbot?.name || "N/A"}</div>
              <p className="text-xs text-muted-foreground">Popular chatbot</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>Manage your chatbot inventory system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start bg-transparent">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" className="justify-start bg-transparent">
                <Bot className="mr-2 h-4 w-4" />
                Manage Vendors
              </Button>
              <Button variant="outline" className="justify-start bg-transparent">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
