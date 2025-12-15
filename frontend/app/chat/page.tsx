"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function UserDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [chatbots, setChatbots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = getAuthUser()

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "user") {
      router.push("/login")
      return
    }
    loadChatbots()
  }, [router, user])

  const loadChatbots = async () => {
    try {
      const data = await api.getAllChatbots() // Make sure this returns user-visible chatbots
      setChatbots(data || [])
    } catch (err) {
      toast({ title: "Error", description: "Failed to load chatbots", variant: "destructive" })
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
    <div className="min-h-screen bg-background p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>{user.email}</span>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      {loading ? (
        <p>Loading chatbots...</p>
      ) : chatbots.length === 0 ? (
        <p>No chatbots available</p>
      ) : (
        <ul className="space-y-2">
          {chatbots.map((c) => (
            <li key={c.id} className="border p-2 rounded">{c.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
