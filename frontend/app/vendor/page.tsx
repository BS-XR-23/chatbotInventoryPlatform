"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth"
import { api } from "@/lib/api"
import { LogOut, Bot, Plus, BarChart3, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function VendorDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [chatbots, setChatbots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = getAuthUser()

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "vendor") {
      router.push("/login")
      return
    }

    loadChatbots()
  }, [router, user])

  const loadChatbots = async () => {
    try {
      const data = await api.getVendorChatbots()
      setChatbots(data || [])
    } catch (error) {
      console.error("Failed to load chatbots:", error)
      toast({
        title: "Error",
        description: "Failed to load chatbots",
        variant: "destructive",
      })
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
          <div>
            <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
            {user.vendor_domain && <p className="text-sm text-muted-foreground">Domain: {user.vendor_domain}</p>}
          </div>
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Chatbots</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Chatbot
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading chatbots...</div>
        ) : chatbots.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No chatbots yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">Create your first chatbot to get started</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Chatbot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id}>
                <CardHeader>
                  <CardTitle>{chatbot.name}</CardTitle>
                  <CardDescription>{chatbot.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{chatbot.status || "Active"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <FileText className="mr-1 h-3 w-3" />
                      Documents
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <BarChart3 className="mr-1 h-3 w-3" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your chatbot inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <FileText className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
