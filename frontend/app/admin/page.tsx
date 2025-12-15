"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = getAuthUser()

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "admin") {
      router.push("/login")
      return
    }
    loadVendors()
  }, [router, user])

  const loadVendors = async () => {
    try {
      const data = await api.getAllVendors() // You should implement this in api.ts
      setVendors(data || [])
    } catch (err) {
      toast({ title: "Error", description: "Failed to load vendors", variant: "destructive" })
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>{user.email}</span>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      {loading ? (
        <p>Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p>No vendors yet</p>
      ) : (
        <ul className="space-y-2">
          {vendors.map((v) => (
            <li key={v.id} className="border p-2 rounded">{v.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
