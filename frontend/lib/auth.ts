// auth.ts
export interface User {
  id: string
  email: string
  role: string
  name?: string
  vendor_domain?: string
}

export const AUTH_STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
} as const

export function saveAuthData(token: string, role: string, email: string, vendor_domain?: string): void {
  if (typeof window === "undefined") return

  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token)

  const user: User = {
    id: "",
    email,
    role,
    vendor_domain,
  }
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

export function clearAuthData(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN)
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
