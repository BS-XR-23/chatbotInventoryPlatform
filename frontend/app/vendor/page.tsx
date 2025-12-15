"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { getAuthUser, clearAuthData } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/protected-route"

function VendorDashboardContent() {
  const { toast } = useToast()
  const [chatbots, setChatbots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChatbots = async () => {
      try {
        const data = await api.getVendorChatbots()
        setChatbots(data || [])
      } catch {
        toast({ title: "Error", description: "Failed to load chatbots", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadChatbots()
  }, [toast])

  const handleLogout = () => {
    clearAuthData()
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>{getAuthUser()?.email}</span>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      {loading ? (
        <p>Loading chatbots...</p>
      ) : chatbots.length === 0 ? (
        <p>No chatbots yet</p>
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

export default function VendorPage() {
  return (
    <ProtectedRoute allowedRoles={["vendor"]}>
      <VendorDashboardContent />
    </ProtectedRoute>
  )
}
