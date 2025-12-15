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
}

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken()
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })
  return handleResponse(response)
}

export const api = {
  // Authentication
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    let endpoint: string

    switch (credentials.role) {
      case "admin":
        endpoint = `${API_BASE_URL}/auth/admin/token`
        break
      case "user":
        endpoint = `${API_BASE_URL}/auth/user/token`
        break
      case "vendor":
        if (!credentials.vendor_domain) {
          throw new Error("Vendor domain is required for vendor login")
        }
        endpoint = `${API_BASE_URL}/auth/vendor/${credentials.vendor_domain}/token`
        break
      default:
        throw new Error("Invalid role")
    }

    const formData = new URLSearchParams()
    formData.append("username", credentials.email)
    formData.append("password", credentials.password)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    return handleResponse(response)
  },

  // Admin endpoints
  createAdmin: (data: any) => fetchAPI("/admins/create", { method: "POST", body: JSON.stringify(data) }),
  getAdmin: (adminId: number) => fetchAPI(`/admins/me/${adminId}`),
  updateAdmin: (adminId: number, data: any) =>
    fetchAPI(`/admins/edit/${adminId}`, { method: "PUT", body: JSON.stringify(data) }),
  changeAdminPassword: (data: any) =>
    fetchAPI("/admins/change-password", { method: "PUT", body: JSON.stringify(data) }),
  updateVendorStatus: (vendorId: number, data: any) =>
    fetchAPI(`/admins/update-vendors/${vendorId}`, { method: "PUT", body: JSON.stringify(data) }),
  getAdminDocuments: () => fetchAPI("/admins/documents"),
  duplicateChatbot: (chatbotId: number) => fetchAPI(`/admins/chatbots/duplicate/${chatbotId}`, { method: "POST" }),
  getMostUsersByVendors: () => fetchAPI("/admins/most-users-by-vendors"),
  getMostChatbotsByVendors: () => fetchAPI("/admins/most-chatbots-by-vendors"),
  getMostUsedChatbot: () => fetchAPI("/admins/most-used-chatbot"),
  getTotalTokensByVendor: (vendorId: number) => fetchAPI(`/admins/total-tokens/${vendorId}`),

  // Vendor endpoints
  createVendor: (data: any) => fetchAPI("/vendors/create", { method: "POST", body: JSON.stringify(data) }),
  getAllVendors: () => fetchAPI("/vendors/all-vendors"),
  getVendor: (vendorId: number) => fetchAPI(`/vendors/${vendorId}`),
  updateVendor: (vendorId: number, data: any) =>
    fetchAPI(`/vendors/update/${vendorId}`, { method: "PUT", body: JSON.stringify(data) }),
  getVendorTopChatbotsByMessages: () => fetchAPI("/vendors/top-chatbots/messages"),
  getVendorTopChatbotsByUsers: () => fetchAPI("/vendors/top-chatbots/users"),
  getVendorDailyMessages: () => fetchAPI("/vendors/daily/messages"),
  getVendorDailyUniqueUsers: () => fetchAPI("/vendors/daily/unique-users"),
  getVendorUserTokensLast7Days: (userId: number) => fetchAPI(`/vendors/user/${userId}/tokens-last7`),
  getVendorUserTokensTotal: (userId: number) => fetchAPI(`/vendors/user/${userId}/tokens-total`),
  getVendorUserChatbotMessagesCount: (userId: number, chatbotId: number) =>
    fetchAPI(`/vendors/user/${userId}/chatbot/${chatbotId}/messages-count`),

  // User endpoints
  createUser: (data: any) => fetchAPI("/users/create", { method: "POST", body: JSON.stringify(data) }),
  getUser: (userId: number) => fetchAPI(`/users/${userId}`),
  getVendorUsers: () => fetchAPI("/users/"),
  updateUser: (userId: number, data: any) =>
    fetchAPI(`/users/update/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (userId: number) => fetchAPI(`/users/${userId}`, { method: "DELETE" }),

  // Chatbot endpoints
  createChatbot: (data: any) => fetchAPI("/chatbots/", { method: "POST", body: JSON.stringify(data) }),
  getVendorChatbots: () => fetchAPI("/chatbots/"),
  getAllChatbots: () => fetchAPI("/chatbots/"),
  getChatbot: (chatbotId: number) => fetchAPI(`/chatbots/${chatbotId}`),
  updateChatbot: (chatbotId: number, data: any) =>
    fetchAPI(`/chatbots/${chatbotId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChatbot: (chatbotId: number) => fetchAPI(`/chatbots/${chatbotId}`, { method: "DELETE" }),

  askChatbot: async (chatbotId: number, question: string) => {
    const response = await fetch(`${API_BASE_URL}/chatbots/${chatbotId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    })
    return response.json()
  },

  chatWithChatbot: (chatbotId: number, data: { question: string; session_id?: string }) =>
    fetchAPI(`/chatbots/${chatbotId}/chat`, { method: "POST", body: JSON.stringify(data) }),

  getGlobalTopChatbots: () => fetchAPI("/chatbots/global/top-chatbots"),

  // Conversation endpoints
  getUserConversations: () => fetchAPI("/conversations/"),
  getUserChatbotConversations: (chatbotId: number) => fetchAPI(`/conversations/${chatbotId}`),
  deleteConversation: (conversationId: number) => fetchAPI(`/conversations/${conversationId}`, { method: "DELETE" }),

  // Document endpoints
  previewDocument: (formData: FormData) => {
    const token = localStorage.getItem("token")
    return fetch(`${API_BASE_URL}/documents/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((res) => res.json())
  },

  saveDocument: (formData: FormData) => {
    const token = localStorage.getItem("token")
    return fetch(`${API_BASE_URL}/documents/add`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then((res) => res.json())
  },

  getDocuments: () => fetchAPI("/documents/"),
  getDocument: (documentId: number) => fetchAPI(`/documents/${documentId}`),
  updateDocument: (documentId: number, data: any) =>
    fetchAPI(`/documents/${documentId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDocument: (documentId: number) => fetchAPI(`/documents/${documentId}`, { method: "DELETE" }),
  createKnowledgeBase: (documentId: number) => fetchAPI(`/documents/${documentId}/knowledge-base`, { method: "POST" }),

  // LLM endpoints
  createLLM: (data: any) => fetchAPI("/llms/", { method: "POST", body: JSON.stringify(data) }),
  getLLMs: () => fetchAPI("/llms/"),
  getLLM: (llmId: number) => fetchAPI(`/llms/${llmId}`),
  updateLLM: (llmId: number, data: any) => fetchAPI(`/llms/${llmId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteLLM: (llmId: number) => fetchAPI(`/llms/${llmId}`, { method: "DELETE" }),

  // Embedding endpoints
  createEmbedding: (data: any) => fetchAPI("/embeddings/create", { method: "POST", body: JSON.stringify(data) }),
  getEmbeddings: () => fetchAPI("/embeddings/"),
  getEmbedding: (embeddingId: number) => fetchAPI(`/embeddings/${embeddingId}`),
  updateEmbedding: (embeddingId: number, data: any) =>
    fetchAPI(`/embeddings/update/${embeddingId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmbedding: (embeddingId: number) => fetchAPI(`/embeddings/delete/${embeddingId}`, { method: "DELETE" }),

  // API Keys endpoints
  createAPIKey: (data: any) => fetchAPI("/api-keys/", { method: "POST", body: JSON.stringify(data) }),
  getAPIKeys: () => fetchAPI("/api-keys/"),
  getAPIKey: (keyId: number) => fetchAPI(`/api-keys/${keyId}`),
  updateAPIKey: (keyId: number, data: any) =>
    fetchAPI(`/api-keys/${keyId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAPIKey: (keyId: number) => fetchAPI(`/api-keys/${keyId}`, { method: "DELETE" }),
}
