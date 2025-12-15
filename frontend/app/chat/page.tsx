"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAuthUser, isAuthenticated, clearAuthData } from "@/lib/auth"
import { api } from "@/lib/api"
import { LogOut, Send, MessageSquare, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const user = getAuthUser()

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "user") {
      router.push("/login")
      return
    }

    loadConversations()
  }, [router, user])

  const loadConversations = async () => {
    try {
      const data = await api.getUserConversations()
      setConversations(data || [])
    } catch (error) {
      console.error("Failed to load conversations:", error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeConversation) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setLoading(true)

    try {
      const conversation = conversations.find((c) => c.id === activeConversation)
      if (!conversation) throw new Error("Conversation not found")

      const response = await api.chatWithChatbot(conversation.chatbot_id, {
        question: inputMessage,
        session_id: activeConversation,
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer || response.response || "No response",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <div className="flex-1 space-y-2 overflow-auto p-2">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={activeConversation === conv.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {conv.title || "New Chat"}
                </Button>
              ))
            )}
          </div>
          <div className="border-t p-2">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <header className="border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-xl font-semibold">Chat</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <div className="container mx-auto max-w-3xl space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground">Type a message below to begin chatting</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <Card
                    className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%]">
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

        <footer className="border-t p-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={loading}
              />
              <Button onClick={handleSendMessage} disabled={loading || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
