// lib/api.ts
import { getAuthToken } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9000"

export interface LoginCredentials {
  email: string
  password: string
  role: "admin" | "vendor" | "user"
  vendor_domain?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  vendor?: { email: string; role: string; domain: string }
}

// Generic fetch wrapper
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(errorData.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    let endpoint = ""
    switch (credentials.role) {
      case "admin":
        endpoint = "/auth/admin/token"
        break
      case "user":
        endpoint = "/auth/user/token"
        break
      case "vendor":
        if (!credentials.vendor_domain) throw new Error("Vendor domain is required")
        endpoint = `/auth/vendor/${credentials.vendor_domain}/token`
        break
      default:
        throw new Error("Invalid role")
    }

    const formData = new URLSearchParams()
    formData.append("username", credentials.email)
    formData.append("password", credentials.password)

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Invalid credentials" }))
      throw new Error(err.detail || "Login failed")
    }

    return response.json()
  },

  getVendorChatbots: () => fetchAPI("/chatbots/"),
}
