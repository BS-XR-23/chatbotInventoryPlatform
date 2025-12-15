export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Chatbot Inventory"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9000"

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ADMIN: "/admin",
  VENDOR: "/vendor",
  CHAT: "/chat",
} as const

export const ROLE_ROUTES = {
  admin: ROUTES.ADMIN,
  vendor: ROUTES.VENDOR,
  user: ROUTES.CHAT,
} as const

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [".pdf", ".txt", ".doc", ".docx", ".csv", ".json"],
} as const

export const CHATBOT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export const DOCUMENT_STATUS = {
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
} as const
