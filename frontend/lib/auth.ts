// lib/auth.ts
export interface User {
  email: string
  role: "admin" | "vendor" | "user"
  vendor_domain?: string
}

export const AUTH_STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
} as const

export function saveAuthData(token: string, user: User) {
  if (typeof window === "undefined") return
  console.log("[Auth] Saving token and user:", token, user)
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token)
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user))
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
}

export function getAuthUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function clearAuthData() {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN)
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
