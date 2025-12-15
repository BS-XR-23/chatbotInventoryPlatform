export interface User {
  id: number
  email: string
  name?: string
  role: "admin" | "vendor" | "user"
  created_at: string
  updated_at?: string
  vendor_id?: number
}

export interface Admin {
  id: number
  email: string
  name: string
  role: "admin"
  created_at: string
  updated_at?: string
  permissions?: string[]
}

export interface Vendor {
  id: number
  email: string
  name: string
  company_name?: string
  domain: string
  plan?: string
  status: "active" | "inactive" | "pending"
  created_at: string
  updated_at?: string
}

export interface Chatbot {
  id: number
  name: string
  description?: string
  vendor_id: number
  status: "active" | "inactive"
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  llm_id?: number
  embedding_id?: number
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: number
  user_id: number
  chatbot_id: number
  session_id?: string
  title?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  content: string
  role: "user" | "assistant" | "system"
  tokens_used?: number
  created_at: string
}

export interface Document {
  id: number
  chatbot_id: number
  filename: string
  file_type: string
  file_path: string
  size: number
  status: "processing" | "ready" | "failed"
  created_at: string
  updated_at?: string
}

export interface LLM {
  id: number
  name: string
  provider: string
  model_name: string
  api_key?: string
  vendor_id?: number
  created_at: string
  updated_at?: string
}

export interface Embedding {
  id: number
  name: string
  provider: string
  model_name: string
  dimensions?: number
  vendor_id?: number
  created_at: string
  updated_at?: string
}

export interface APIKey {
  id: number
  key_name: string
  key_value: string
  vendor_id: number
  chatbot_id?: number
  is_active: boolean
  created_at: string
  expires_at?: string
}

export interface Analytics {
  date: string
  message_count: number
  user_count: number
  chatbot_id?: number
  tokens_used?: number
}

export interface ChatbotStats {
  chatbot_id: number
  chatbot_name: string
  message_count: number
  user_count: number
  tokens_used?: number
}

export interface VendorStats {
  vendor_id: number
  vendor_name: string
  user_count: number
  chatbot_count: number
  total_messages: number
  total_tokens?: number
}
